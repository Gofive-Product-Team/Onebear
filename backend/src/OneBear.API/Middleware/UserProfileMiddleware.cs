using System.Security.Claims;
using System.Text.Json;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Middleware;

/// <summary>
/// Runs after JWT validation and before authorization.
/// Resolves the authenticated user's UserProfile from MongoDB (with Redis cache),
/// then injects company_id, permissions, and display_name as additional claims.
/// Returns 403 if no profile found or account is disabled.
/// </summary>
public class UserProfileMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserProfileMiddleware> _logger;

    private static readonly string[] SkipPathPrefixes =
    [
        "/api/v1/auth/register",
        "/api/v1/health",
        "/hubs/",
        "/swagger",
        "/api/v1/webhooks/"
    ];

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public UserProfileMiddleware(RequestDelegate next, ILogger<UserProfileMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip unauthenticated requests
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // Skip API key auth (service-to-service)
        if (context.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            await _next(context);
            return;
        }

        // Skip excluded paths
        string path = context.Request.Path.Value ?? "";
        foreach (string prefix in SkipPathPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }
        }

        // Extract sub (Keycloak user ID) from JWT
        string? sub = context.User.FindFirstValue("sub");
        _logger.LogInformation("[UserProfileMiddleware] path={Path} sub={Sub} claims=[{Claims}]",
            path, sub ?? "(null)",
            string.Join(", ", context.User.Claims.Select(c => $"{c.Type}={c.Value[..Math.Min(c.Value.Length, 30)]}")));
        if (string.IsNullOrEmpty(sub))
        {
            _logger.LogWarning("[UserProfileMiddleware] No sub claim found, skipping");
            await _next(context);
            return;
        }

        // Resolve services from DI
        ICacheService cacheService = context.RequestServices.GetRequiredService<ICacheService>();
        IUserProfileRepository userProfileRepo = context.RequestServices.GetRequiredService<IUserProfileRepository>();

        // Look up UserProfile with Redis cache
        string cacheKey = $"userprofile:{sub}";
        UserProfile? profile = await cacheService.GetAsync<UserProfile>(cacheKey);

        if (profile is null)
        {
            profile = await userProfileRepo.GetByKeycloakUserIdAsync(sub, context.RequestAborted);

            if (profile is not null)
            {
                await cacheService.SetAsync(cacheKey, profile, CacheTtl, context.RequestAborted);
            }
        }

        // No profile found -> 403 NO_COMPANY
        if (profile is null)
        {
            _logger.LogWarning("No UserProfile found for Keycloak user {Sub}", sub);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "NO_COMPANY",
                message = "No company assigned to this account."
            }));
            return;
        }

        // Account disabled -> 403 ACCOUNT_DISABLED
        if (!profile.IsActive)
        {
            _logger.LogWarning("Disabled account attempted access: {Sub} ({Email})", sub, profile.Email);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "ACCOUNT_DISABLED",
                message = "This account has been deactivated."
            }));
            return;
        }

        // Inject additional claims into the identity
        ClaimsIdentity identity = (ClaimsIdentity)context.User.Identity!;
        identity.AddClaim(new Claim(AuthConstants.ClaimCompanyId, profile.CompanyId));
        identity.AddClaim(new Claim(AuthConstants.ClaimDisplayName, profile.DisplayName ?? ""));
        identity.AddClaim(new Claim(AuthConstants.ClaimPermissions,
            JsonSerializer.Serialize(profile.Permissions)));

        // Fire-and-forget: update LastLoginTimestamp
        _ = Task.Run(async () =>
        {
            try
            {
                profile.LastLoginTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await userProfileRepo.UpdateAsync(profile, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update LastLoginTimestamp for {Sub}", sub);
            }
        });

        await _next(context);
    }
}

public static class UserProfileMiddlewareExtensions
{
    public static IApplicationBuilder UseUserProfile(this IApplicationBuilder app)
        => app.UseMiddleware<UserProfileMiddleware>();
}

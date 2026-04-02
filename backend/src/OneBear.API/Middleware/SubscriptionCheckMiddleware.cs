using System.Text.Json;
using OneBear.API.Auth;
using OneBear.Domain.Interfaces;

namespace OneBear.API.Middleware;

/// <summary>
/// Checks company subscription status after authentication.
/// Returns 403 for expired/trial-expired subscriptions.
/// Skips for API key auth and development environment.
/// </summary>
public class SubscriptionCheckMiddleware
{
    private readonly RequestDelegate _next;
    private readonly bool _isDevelopment;

    public SubscriptionCheckMiddleware(RequestDelegate next, bool isDevelopment)
    {
        _next = next;
        _isDevelopment = isDevelopment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip in development
        if (_isDevelopment)
        {
            await _next(context);
            return;
        }

        // Skip for unauthenticated requests (auth middleware handles this)
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // Skip for API key auth (service-to-service)
        if (context.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            await _next(context);
            return;
        }

        // Get company ID from claims
        string? companyId = context.User.FindFirst(AuthConstants.ClaimCompanyId)?.Value;
        if (string.IsNullOrEmpty(companyId))
        {
            await _next(context);
            return;
        }

        // Check cached subscription status
        ICacheService cacheService = context.RequestServices.GetRequiredService<ICacheService>();
        string? subscriptionStatus = await cacheService.GetAsync<string>($"subscription:{companyId}");

        if (subscriptionStatus is "Expired" or "TrialExpired")
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                error = "subscription_expired",
                message = "Your subscription has expired"
            }));
            return;
        }

        await _next(context);
    }
}

public static class SubscriptionCheckMiddlewareExtensions
{
    public static IApplicationBuilder UseSubscriptionCheck(this IApplicationBuilder app, bool isDevelopment)
    {
        return app.UseMiddleware<SubscriptionCheckMiddleware>(isDevelopment);
    }
}

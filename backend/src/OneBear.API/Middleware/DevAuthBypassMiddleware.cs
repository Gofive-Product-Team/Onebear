using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OneBear.API.Auth;

namespace OneBear.API.Middleware;

/// <summary>
/// Development-only middleware that auto-authenticates requests without a token.
/// If no Authorization header and no X-Api-Key header, sets a default dev user identity.
/// This allows using Swagger and direct HTTP calls without obtaining a JWT first.
/// NEVER registered in production.
/// </summary>
public class DevAuthBypassMiddleware
{
    private readonly RequestDelegate _next;
    private readonly AuthOptions _authOptions;

    public DevAuthBypassMiddleware(RequestDelegate next, IOptions<AuthOptions> authOptions)
    {
        _next = next;
        _authOptions = authOptions.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        bool hasAuthHeader = context.Request.Headers.ContainsKey("Authorization");
        bool hasApiKey = context.Request.Headers.ContainsKey("X-Api-Key");
        bool isDevTokenEndpoint = context.Request.Path.StartsWithSegments("/api/v1/dev");
        bool isSwagger = context.Request.Path.StartsWithSegments("/swagger");
        bool isHealthCheck = context.Request.Path.StartsWithSegments("/api/v1/health");

        if (!hasAuthHeader && !hasApiKey && !isDevTokenEndpoint && !isSwagger && !isHealthCheck)
        {
            // Generate a dev JWT and inject it into the request
            string token = GenerateDevToken();
            context.Request.Headers.Append("Authorization", $"Bearer {token}");
        }

        await _next(context);
    }

    private string GenerateDevToken()
    {
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_authOptions.DevSigningKey));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        int[] permissions = [3001, 3002, 3003, 3004, 3005];

        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, "dev-user-001"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(AuthConstants.ClaimCompanyId, "dev-company-001"),
            new(AuthConstants.ClaimDisplayName, "Dev Bypass User"),
            new(AuthConstants.ClaimEmail, "dev@onebear.local"),
            new(AuthConstants.ClaimPermissions, JsonSerializer.Serialize(permissions)),
        ];

        JwtSecurityToken token = new(
            issuer: "onebear-dev",
            audience: _authOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

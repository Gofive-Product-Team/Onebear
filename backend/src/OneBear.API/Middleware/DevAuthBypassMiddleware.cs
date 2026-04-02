using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

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
    private readonly string _devSigningKey;
    private readonly string _audience;

    public DevAuthBypassMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _devSigningKey = config["Auth:DevSigningKey"] ?? "OneBear-Dev-Signing-Key-Min-32-Chars!!";
        _audience = config["Auth:Audience"] ?? "onebear-api";
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
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_devSigningKey));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new(JwtRegisteredClaimNames.Sub, "dev-user-001"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("company_id", "dev-company-001"),
            new("name", "Dev Bypass User"),
            new("email", "dev@onebear.local"),
            new("permissions", "3001"),
            new("permissions", "3002"),
            new("permissions", "3003"),
            new("permissions", "3004"),
            new("permissions", "3005"),
        ];

        JwtSecurityToken token = new(
            issuer: "onebear-dev",
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

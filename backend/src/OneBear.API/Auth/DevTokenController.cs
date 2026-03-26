using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace OneBear.API.Auth;

/// <summary>
/// Development-only endpoint to generate JWT tokens for local testing.
/// NOT registered in production environments.
/// </summary>
[ApiController]
[Route("api/v1/dev")]
public class DevTokenController : ControllerBase
{
    private readonly IConfiguration _config;

    public DevTokenController(IConfiguration config)
    {
        _config = config;
    }

    [AllowAnonymous]
    [HttpPost("token")]
    public IActionResult GenerateToken([FromBody] DevTokenRequest request)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Auth:DevSigningKey"] ?? "OneBear-Dev-Signing-Key-Min-32-Chars!!"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, request.UserId ?? "dev-user-001"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("company_id", request.CompanyId ?? "dev-company-001"),
            new("name", request.DisplayName ?? "Dev User"),
            new("email", request.Email ?? "dev@onebear.local"),
        };

        // Add permissions as individual claims
        int[] permissions = request.Permissions ?? new[] { 3001, 3002, 3003, 3004, 3005 };
        foreach (int perm in permissions)
        {
            claims.Add(new Claim("permissions", perm.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _config["Auth:DevIssuer"] ?? "onebear-dev",
            audience: _config["Auth:Audience"] ?? "onebear-api",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(request.ExpiresInHours ?? 24),
            signingCredentials: credentials
        );

        string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new DevTokenResponse
        {
            AccessToken = tokenString,
            ExpiresIn = (int)TimeSpan.FromHours(request.ExpiresInHours ?? 24).TotalSeconds,
            TokenType = "Bearer",
            UserId = request.UserId ?? "dev-user-001",
            CompanyId = request.CompanyId ?? "dev-company-001",
            Permissions = permissions
        });
    }
}

public class DevTokenRequest
{
    public string? UserId { get; set; }
    public string? CompanyId { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public int[]? Permissions { get; set; }
    public int? ExpiresInHours { get; set; }
}

public class DevTokenResponse
{
    public string AccessToken { get; set; } = default!;
    public int ExpiresIn { get; set; }
    public string TokenType { get; set; } = "Bearer";
    public string UserId { get; set; } = default!;
    public string CompanyId { get; set; } = default!;
    public int[] Permissions { get; set; } = Array.Empty<int>();
}

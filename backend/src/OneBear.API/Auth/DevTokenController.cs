using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
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
    private readonly AuthOptions _authOptions;

    public DevTokenController(IOptions<AuthOptions> authOptions)
    {
        _authOptions = authOptions.Value;
    }

    [AllowAnonymous]
    [HttpPost("token")]
    public IActionResult GenerateToken([FromBody] DevTokenRequest request)
    {
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_authOptions.DevSigningKey));
        SigningCredentials credentials = new(key, SecurityAlgorithms.HmacSha256);

        string userId = request.UserId ?? "dev-user-001";
        string companyId = request.CompanyId ?? "dev-company-001";
        string displayName = request.DisplayName ?? "Dev User";
        string email = request.Email ?? "dev@onebear.local";
        int[] permissions = request.Permissions ?? [3001, 3002, 3003, 3004, 3005];

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(AuthConstants.ClaimCompanyId, companyId),
            new(AuthConstants.ClaimDisplayName, displayName),
            new(AuthConstants.ClaimEmail, email),
            new(AuthConstants.ClaimPermissions, JsonSerializer.Serialize(permissions))
        ];

        int expiresInHours = request.ExpiresInHours ?? 24;
        JwtSecurityToken token = new(
            issuer: "onebear-dev",
            audience: _authOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiresInHours),
            signingCredentials: credentials);

        string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new DevTokenResponse
        {
            AccessToken = tokenString,
            ExpiresIn = (int)TimeSpan.FromHours(expiresInHours).TotalSeconds,
            TokenType = "Bearer",
            UserId = userId,
            CompanyId = companyId,
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
    public int[] Permissions { get; set; } = [];
}

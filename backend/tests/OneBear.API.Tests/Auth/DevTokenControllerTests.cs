using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class DevTokenControllerTests
{
    private readonly AuthOptions _authOptions = new()
    {
        DevSigningKey = "OneBear-Dev-Signing-Key-Min-32-Chars!!",
        Audience = "onebear-api"
    };

    private DevTokenController CreateController()
    {
        return new DevTokenController(Options.Create(_authOptions));
    }

    [Fact]
    public void ShouldReturnJwt_WithValidRequest()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new()
        {
            UserId = "test-user",
            CompanyId = "test-company",
            DisplayName = "Test User",
            Permissions = [3001, 3002]
        };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.NotEmpty(response.AccessToken);
        Assert.Equal("Bearer", response.TokenType);
        Assert.Equal("test-user", response.UserId);
        Assert.Equal("test-company", response.CompanyId);
        Assert.Equal(new[] { 3001, 3002 }, response.Permissions);
    }

    [Fact]
    public void ShouldIncludeAllClaims_InGeneratedToken()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new()
        {
            UserId = "agent-001",
            CompanyId = "company-demo-001",
            DisplayName = "Demo Agent",
            Email = "demo@test.com",
            Permissions = [3001, 3003, 3005]
        };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);

        // Decode JWT and verify claims
        JwtSecurityTokenHandler handler = new();
        JwtSecurityToken jwt = handler.ReadJwtToken(response.AccessToken);

        Assert.Equal("agent-001", jwt.Claims.First(c => c.Type == AuthConstants.ClaimUserId).Value);
        Assert.Equal("company-demo-001", jwt.Claims.First(c => c.Type == AuthConstants.ClaimCompanyId).Value);
        Assert.Equal("Demo Agent", jwt.Claims.First(c => c.Type == AuthConstants.ClaimDisplayName).Value);
        Assert.Equal("demo@test.com", jwt.Claims.First(c => c.Type == AuthConstants.ClaimEmail).Value);
        Assert.Equal("onebear-api", jwt.Audiences.First());

        // Permissions should be a JSON array in a single claim
        string permissionsValue = jwt.Claims.First(c => c.Type == AuthConstants.ClaimPermissions).Value;
        int[] permissions = JsonSerializer.Deserialize<int[]>(permissionsValue)!;
        Assert.Equal(new[] { 3001, 3003, 3005 }, permissions);
    }

    [Fact]
    public void ShouldUseDefaults_WhenFieldsAreNull()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new(); // All null

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.Equal("dev-user-001", response.UserId);
        Assert.Equal("dev-company-001", response.CompanyId);
        Assert.Equal(new[] { 3001, 3002, 3003, 3004, 3005 }, response.Permissions);
    }

    [Fact]
    public void ShouldSetCorrectExpiry()
    {
        DevTokenController controller = CreateController();
        DevTokenRequest request = new() { ExpiresInHours = 2 };

        IActionResult result = controller.GenerateToken(request);

        OkObjectResult okResult = Assert.IsType<OkObjectResult>(result);
        DevTokenResponse response = Assert.IsType<DevTokenResponse>(okResult.Value);
        Assert.Equal(7200, response.ExpiresIn); // 2 hours in seconds
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetUserId_ShouldReturnSubClaim()
    {
        // Arrange
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, "user-123") };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        string? userId = principal.GetUserId();

        // Assert
        Assert.Equal("user-123", userId);
    }

    [Fact]
    public void GetUserId_ShouldFallbackToNameIdentifier_WhenNoSubClaim()
    {
        // Arrange
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user-456") };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        string? userId = principal.GetUserId();

        // Assert
        Assert.Equal("user-456", userId);
    }

    [Fact]
    public void GetUserId_ShouldReturnNull_WhenNoClaims()
    {
        // Arrange
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity());

        // Act
        string? userId = principal.GetUserId();

        // Assert
        Assert.Null(userId);
    }

    [Fact]
    public void GetCompanyId_ShouldReturnCompanyIdClaim()
    {
        // Arrange
        var claims = new[] { new Claim("company_id", "comp-001") };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        string? companyId = principal.GetCompanyId();

        // Assert
        Assert.Equal("comp-001", companyId);
    }

    [Fact]
    public void GetCompanyId_ShouldReturnNull_WhenNoCompanyIdClaim()
    {
        // Arrange
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity());

        // Act
        string? companyId = principal.GetCompanyId();

        // Assert
        Assert.Null(companyId);
    }

    [Fact]
    public void GetPermissions_ShouldReturnAllPermissionValues()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("permissions", "3001"),
            new Claim("permissions", "3003"),
            new Claim("permissions", "3005")
        };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        List<int> permissions = principal.GetPermissions().ToList();

        // Assert
        Assert.Equal(3, permissions.Count);
        Assert.Contains(3001, permissions);
        Assert.Contains(3003, permissions);
        Assert.Contains(3005, permissions);
    }

    [Fact]
    public void GetPermissions_ShouldSkipNonNumericValues()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("permissions", "3001"),
            new Claim("permissions", "invalid"),
            new Claim("permissions", "3002")
        };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        List<int> permissions = principal.GetPermissions().ToList();

        // Assert
        Assert.Equal(2, permissions.Count);
        Assert.Contains(3001, permissions);
        Assert.Contains(3002, permissions);
    }

    [Fact]
    public void GetPermissions_ShouldReturnEmpty_WhenNoPermissionClaims()
    {
        // Arrange
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity());

        // Act
        List<int> permissions = principal.GetPermissions().ToList();

        // Assert
        Assert.Empty(permissions);
    }

    [Fact]
    public void HasPermission_ShouldReturnTrue_WhenPermissionExists()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("permissions", "3001"),
            new Claim("permissions", "3002")
        };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        bool result = principal.HasPermission(3001);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasPermission_ShouldReturnFalse_WhenPermissionDoesNotExist()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("permissions", "3001"),
            new Claim("permissions", "3002")
        };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        bool result = principal.HasPermission(3005);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GetDisplayName_ShouldReturnNameClaim()
    {
        // Arrange
        var claims = new[] { new Claim("name", "Test User") };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        string? displayName = principal.GetDisplayName();

        // Assert
        Assert.Equal("Test User", displayName);
    }

    [Fact]
    public void GetDisplayName_ShouldFallbackToClaimTypeName_WhenNoNameClaim()
    {
        // Arrange
        var claims = new[] { new Claim(ClaimTypes.Name, "Fallback User") };
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        // Act
        string? displayName = principal.GetDisplayName();

        // Assert
        Assert.Equal("Fallback User", displayName);
    }

    [Fact]
    public void GetDisplayName_ShouldReturnNull_WhenNoNameClaims()
    {
        // Arrange
        ClaimsPrincipal principal = new ClaimsPrincipal(new ClaimsIdentity());

        // Act
        string? displayName = principal.GetDisplayName();

        // Assert
        Assert.Null(displayName);
    }
}

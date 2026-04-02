using System.Security.Claims;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class ClaimsPrincipalExtensionsTests
{
    // --- GetUserId ---

    [Fact]
    public void GetUserId_ShouldReturnSubClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimUserId, "user-123")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        string userId = principal.GetUserId();

        Assert.Equal("user-123", userId);
    }

    [Fact]
    public void GetUserId_ShouldThrow_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Throws<UnauthorizedAccessException>(() => principal.GetUserId());
    }

    // --- GetCompanyId ---

    [Fact]
    public void GetCompanyId_ShouldReturnCompanyIdClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimCompanyId, "comp-001")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        string companyId = principal.GetCompanyId();

        Assert.Equal("comp-001", companyId);
    }

    [Fact]
    public void GetCompanyId_ShouldThrow_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Throws<UnauthorizedAccessException>(() => principal.GetCompanyId());
    }

    // --- GetDisplayName ---

    [Fact]
    public void GetDisplayName_ShouldReturnClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimDisplayName, "Test User")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("Test User", principal.GetDisplayName());
    }

    [Fact]
    public void GetDisplayName_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetDisplayName());
    }

    // --- GetEmail ---

    [Fact]
    public void GetEmail_ShouldReturnClaim()
    {
        Claim[] claims = [new(AuthConstants.ClaimEmail, "test@example.com")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("test@example.com", principal.GetEmail());
    }

    [Fact]
    public void GetEmail_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetEmail());
    }

    // --- GetPermissions (JSON array format) ---

    [Fact]
    public void GetPermissions_ShouldParseJsonArray()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002,3005]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        int[] permissions = principal.GetPermissions();

        Assert.Equal(3, permissions.Length);
        Assert.Contains(3001, permissions);
        Assert.Contains(3002, permissions);
        Assert.Contains(3005, permissions);
    }

    [Fact]
    public void GetPermissions_ShouldReturnEmpty_WhenNoClaim()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        int[] permissions = principal.GetPermissions();

        Assert.Empty(permissions);
    }

    [Fact]
    public void GetPermissions_ShouldReturnEmpty_WhenEmptyArray()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        int[] permissions = principal.GetPermissions();

        Assert.Empty(permissions);
    }

    // --- HasPermission ---

    [Fact]
    public void HasPermission_ShouldReturnTrue_WhenPresent()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.True(principal.HasPermission(3001));
    }

    [Fact]
    public void HasPermission_ShouldReturnFalse_WhenAbsent()
    {
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.False(principal.HasPermission(3005));
    }

    // --- IsApiKeyAuth ---

    [Fact]
    public void IsApiKeyAuth_ShouldReturnTrue_WhenApiKeyMethod()
    {
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.True(principal.IsApiKeyAuth());
    }

    [Fact]
    public void IsApiKeyAuth_ShouldReturnFalse_WhenNotApiKey()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.False(principal.IsApiKeyAuth());
    }

    // --- GetApiKeyScope ---

    [Fact]
    public void GetApiKeyScope_ShouldReturnScope()
    {
        Claim[] claims = [new(AuthConstants.ClaimApiKeyScope, "webhook")];
        ClaimsPrincipal principal = new(new ClaimsIdentity(claims));

        Assert.Equal("webhook", principal.GetApiKeyScope());
    }

    [Fact]
    public void GetApiKeyScope_ShouldReturnNull_WhenMissing()
    {
        ClaimsPrincipal principal = new(new ClaimsIdentity());

        Assert.Null(principal.GetApiKeyScope());
    }
}

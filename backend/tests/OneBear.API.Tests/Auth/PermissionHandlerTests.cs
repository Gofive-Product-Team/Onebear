using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class PermissionHandlerTests
{
    private readonly PermissionHandler _handler = new();

    [Fact]
    public async Task HandleRequirementAsync_ShouldSucceed_WhenUserHasMatchingPermission()
    {
        // Arrange
        var requirement = new PermissionRequirement(3001);
        var claims = new[] { new Claim("permissions", "3001") };
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        AuthorizationHandlerContext context = new AuthorizationHandlerContext(
            new[] { requirement }, user, null);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleRequirementAsync_ShouldNotSucceed_WhenUserLacksPermission()
    {
        // Arrange
        var requirement = new PermissionRequirement(3001);
        var claims = new[] { new Claim("permissions", "3002") };
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        AuthorizationHandlerContext context = new AuthorizationHandlerContext(
            new[] { requirement }, user, null);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleRequirementAsync_ShouldNotSucceed_WhenUserHasNoPermissionClaims()
    {
        // Arrange
        var requirement = new PermissionRequirement(3001);
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(Array.Empty<Claim>(), "TestAuth"));
        AuthorizationHandlerContext context = new AuthorizationHandlerContext(
            new[] { requirement }, user, null);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleRequirementAsync_ShouldSucceed_WhenUserHasMultiplePermissionsIncludingRequired()
    {
        // Arrange
        var requirement = new PermissionRequirement(3003);
        var claims = new[]
        {
            new Claim("permissions", "3001"),
            new Claim("permissions", "3003"),
            new Claim("permissions", "3005")
        };
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        AuthorizationHandlerContext context = new AuthorizationHandlerContext(
            new[] { requirement }, user, null);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleRequirementAsync_ShouldNotSucceed_WhenPermissionClaimIsNonNumeric()
    {
        // Arrange
        var requirement = new PermissionRequirement(3001);
        var claims = new[] { new Claim("permissions", "not-a-number") };
        ClaimsPrincipal user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        AuthorizationHandlerContext context = new AuthorizationHandlerContext(
            new[] { requirement }, user, null);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.False(context.HasSucceeded);
    }
}

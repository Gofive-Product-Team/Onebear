using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class PermissionHandlerTests
{
    private readonly PermissionHandler _handler = new();

    private AuthorizationHandlerContext CreateContext(PermissionRequirement requirement, ClaimsPrincipal user)
    {
        return new AuthorizationHandlerContext([requirement], user, null);
    }

    [Fact]
    public async Task ShouldSucceed_WhenUserHasRequiredPermission()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenUserMissingRequiredPermission()
    {
        PermissionRequirement requirement = new(3002);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenNoPermissionsClaim()
    {
        PermissionRequirement requirement = new(3001);
        ClaimsPrincipal user = new(new ClaimsIdentity(Array.Empty<Claim>(), "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldSucceed_WhenMultiplePermissionsAndOneMatches()
    {
        PermissionRequirement requirement = new(3005);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[3001,3002,3003,3004,3005]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldSucceed_WhenApiKeyAuth()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey)];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task ShouldFail_WhenPermissionsClaimIsEmptyArray()
    {
        PermissionRequirement requirement = new(3001);
        Claim[] claims = [new(AuthConstants.ClaimPermissions, "[]")];
        ClaimsPrincipal user = new(new ClaimsIdentity(claims, "TestAuth"));

        AuthorizationHandlerContext context = CreateContext(requirement, user);
        await _handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }
}

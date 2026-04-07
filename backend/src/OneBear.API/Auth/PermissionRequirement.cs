using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace OneBear.API.Auth;

public class PermissionRequirement : IAuthorizationRequirement
{
    public int PermissionId { get; }
    public PermissionRequirement(int permissionId) => PermissionId = permissionId;
}

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // API key auth bypasses permission checks (service-to-service)
        if (context.User.HasClaim(AuthConstants.ClaimAuthMethod, AuthConstants.ClaimAuthMethodApiKey))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check JWT permissions claim (JSON array)
        Claim? permissionsClaim = context.User.FindFirst(AuthConstants.ClaimPermissions);
        if (permissionsClaim is null)
            return Task.CompletedTask; // Fail — no permissions claim

        int[] permissions = JsonSerializer.Deserialize<int[]>(permissionsClaim.Value) ?? [];

        if (permissions.Contains(requirement.PermissionId))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

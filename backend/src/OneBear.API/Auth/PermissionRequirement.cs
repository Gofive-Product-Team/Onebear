using System.Security.Claims;
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
        var permissionClaims = context.User.FindAll("permissions");
        foreach (Claim claim in permissionClaims)
        {
            if (int.TryParse(claim.Value, out int permId) && permId == requirement.PermissionId)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        return Task.CompletedTask; // Not succeeded = forbidden
    }
}

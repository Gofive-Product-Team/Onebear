namespace OneBear.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

[ApiController]
[Authorize]
[Route("api/v1/companies/{companyId}/roles")]
[EnableRateLimiting("api")]
public class RolesController : ControllerBase
{
    private readonly IRoleRepository _roleRepo;
    private readonly IUserProfileRepository _userProfileRepo;
    private readonly ICacheService _cacheService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        IRoleRepository roleRepo,
        IUserProfileRepository userProfileRepo,
        ICacheService cacheService,
        ILogger<RolesController> logger)
    {
        _roleRepo = roleRepo;
        _userProfileRepo = userProfileRepo;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>List all roles for a company.</summary>
    [HttpGet]
    [Authorize(Policy = AuthConstants.PolicyMembersView)]
    public async Task<IActionResult> ListRoles(string companyId, CancellationToken ct)
    {
        List<Role> roles = await _roleRepo.GetByCompanyIdAsync(companyId, ct);
        return Ok(roles);
    }

    /// <summary>Create a custom role.</summary>
    [HttpPost]
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    public async Task<IActionResult> CreateRole(string companyId, [FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Role name is required." });

        Role role = new()
        {
            CompanyId = companyId,
            Name = request.Name,
            Description = request.Description,
            Permissions = request.Permissions ?? new List<int>(),
            IsSystem = false,
            IsOwnerRole = false,
            CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };
        await _roleRepo.CreateAsync(role, ct);

        _logger.LogInformation("Created role {RoleName} for company {CompanyId}", role.Name, companyId);

        return Created($"api/v1/companies/{companyId}/roles/{role.Id}", role);
    }

    /// <summary>Update a role's name, description, or permissions.</summary>
    [HttpPut("{roleId}")]
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    public async Task<IActionResult> UpdateRole(string companyId, string roleId, [FromBody] UpdateRoleRequest request, CancellationToken ct)
    {
        Role? role = await _roleRepo.GetByIdAsync(roleId, ct);
        if (role is null || role.CompanyId != companyId)
            return NotFound();

        if (role.IsOwnerRole)
            return BadRequest(new { error = "CANNOT_EDIT_OWNER", message = "Owner role permissions cannot be changed." });

        if (request.Name is not null) role.Name = request.Name;
        if (request.Description is not null) role.Description = request.Description;
        if (request.Permissions is not null) role.Permissions = request.Permissions;
        role.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _roleRepo.UpdateAsync(role, ct);

        // Sync permissions to all members with this role
        if (request.Permissions is not null)
        {
            List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);
            foreach (UserProfile member in members.Where(m => m.RoleId == roleId))
            {
                member.Permissions = role.Permissions;
                member.RoleName = role.Name;
                await _userProfileRepo.UpdateAsync(member, ct);
                await _cacheService.RemoveAsync($"userprofile:{member.KeycloakUserId}");
            }
        }

        _logger.LogInformation("Updated role {RoleId} for company {CompanyId}", roleId, companyId);

        return Ok(role);
    }

    /// <summary>Delete a custom role (system roles cannot be deleted).</summary>
    [HttpDelete("{roleId}")]
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    public async Task<IActionResult> DeleteRole(string companyId, string roleId, CancellationToken ct)
    {
        Role? role = await _roleRepo.GetByIdAsync(roleId, ct);
        if (role is null || role.CompanyId != companyId)
            return NotFound();

        if (role.IsSystem)
            return BadRequest(new { error = "CANNOT_DELETE_SYSTEM", message = "System roles cannot be deleted." });

        // Check if any members still use this role
        List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);
        int usageCount = members.Count(m => m.RoleId == roleId);
        if (usageCount > 0)
            return Conflict(new { error = "ROLE_IN_USE", message = $"Cannot delete role — {usageCount} member(s) still assigned." });

        await _roleRepo.DeleteAsync(roleId, ct);

        _logger.LogInformation("Deleted role {RoleId} from company {CompanyId}", roleId, companyId);

        return NoContent();
    }
}

public record CreateRoleRequest(string Name, string? Description, List<int>? Permissions);
public record UpdateRoleRequest(string? Name, string? Description, List<int>? Permissions);

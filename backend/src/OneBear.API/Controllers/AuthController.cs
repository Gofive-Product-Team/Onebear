using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Application.Auth;
using OneBear.Application.Auth.Services;
using OneBear.Application.Common;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly KeycloakAdminService _keycloakAdmin;
    private readonly IUserProfileRepository _userProfileRepo;
    private readonly ICompanyFeatureSettingsRepository _companySettingsRepo;
    private readonly ICompanyRepository _companyRepo;
    private readonly IRoleRepository _roleRepo;
    private readonly ICacheService _cacheService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        KeycloakAdminService keycloakAdmin,
        IUserProfileRepository userProfileRepo,
        ICompanyFeatureSettingsRepository companySettingsRepo,
        ICompanyRepository companyRepo,
        IRoleRepository roleRepo,
        ICacheService cacheService,
        ILogger<AuthController> logger)
    {
        _keycloakAdmin = keycloakAdmin;
        _userProfileRepo = userProfileRepo;
        _companySettingsRepo = companySettingsRepo;
        _companyRepo = companyRepo;
        _roleRepo = roleRepo;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new account: creates Keycloak user, company, and user profile.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("auth/register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Email is required." });
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Password must be at least 8 characters." });
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Display name is required." });
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Company name is required." });

        // Check if email already exists in UserProfile
        UserProfile? existing = await _userProfileRepo.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Conflict(new { error = "USER_EXISTS", message = "An account with this email already exists." });

        // Create user in Keycloak
        Result<string> keycloakResult = await _keycloakAdmin.CreateUserAsync(
            request.Email, request.Password, request.DisplayName, ct);

        if (keycloakResult is Result<string>.Failure failure)
        {
            return failure.Error.Type switch
            {
                ErrorType.Conflict => Conflict(new { error = failure.Error.Code, message = failure.Error.Message }),
                _ => StatusCode(500, new { error = failure.Error.Code, message = failure.Error.Message })
            };
        }

        string keycloakUserId = ((Result<string>.Success)keycloakResult).Value;
        long now = DateTimeHelper.NowUnixMilliseconds();

        // Create Company entity
        Company company = new()
        {
            Id = Guid.NewGuid().ToString(),
            Name = request.CompanyName,
            OwnerUserId = keycloakUserId,
            CreatedTimestamp = now
        };
        await _companyRepo.CreateAsync(company, ct);

        // Seed default roles
        Role ownerRole = new()
        {
            CompanyId = company.Id,
            Name = "Owner",
            Description = "Full access to everything",
            Permissions = Permission.OwnerPermissions.ToList(),
            IsSystem = true,
            IsOwnerRole = true,
            CreatedTimestamp = now
        };
        await _roleRepo.CreateAsync(ownerRole, ct);

        Role adminRole = new()
        {
            CompanyId = company.Id,
            Name = "Admin",
            Description = "Manage settings, chat, and customers",
            Permissions = Permission.AdminPermissions.ToList(),
            IsSystem = true,
            IsOwnerRole = false,
            CreatedTimestamp = now
        };
        await _roleRepo.CreateAsync(adminRole, ct);

        Role agentRole = new()
        {
            CompanyId = company.Id,
            Name = "Agent",
            Description = "Handle chats and view customers",
            Permissions = Permission.AgentPermissions.ToList(),
            IsSystem = true,
            IsOwnerRole = false,
            CreatedTimestamp = now
        };
        await _roleRepo.CreateAsync(agentRole, ct);

        // Create CompanyFeatureSettings for the new company
        CompanyFeatureSettings companySettings = new()
        {
            CompanyId = company.Id,
            Features = new Dictionary<string, bool>
            {
                ["social-chat"] = true,
                ["customer"] = true,
                ["dashboard"] = true,
                ["settings"] = true
            },
            Settings = new Dictionary<string, string>
            {
                ["companyName"] = request.CompanyName
            },
            UpdatedTimestamp = now,
            UpdatedBy = keycloakUserId
        };
        await _companySettingsRepo.UpsertAsync(companySettings, ct);

        // Create UserProfile with owner role and all permissions
        UserProfile profile = new()
        {
            KeycloakUserId = keycloakUserId,
            Email = request.Email,
            DisplayName = request.DisplayName,
            CompanyId = company.Id,
            RoleId = ownerRole.Id,
            RoleName = "Owner",
            Permissions = Permission.OwnerPermissions.ToList(),
            IsActive = true,
            CreatedTimestamp = now
        };
        await _userProfileRepo.CreateAsync(profile, ct);

        _logger.LogInformation(
            "Registered new account: {Email}, CompanyId: {CompanyId}, KeycloakUserId: {KeycloakUserId}",
            request.Email, company.Id, keycloakUserId);

        return Ok(new
        {
            profileId = profile.Id,
            companyId = company.Id,
            keycloakUserId,
            email = request.Email,
            displayName = request.DisplayName
        });
    }

    /// <summary>
    /// Returns the current user's profile information from claims injected by UserProfileMiddleware.
    /// </summary>
    [Authorize]
    [HttpGet("auth/me")]
    public IActionResult Me()
    {
        string companyId = User.GetCompanyId();
        string displayName = User.GetDisplayName() ?? "";
        int[] permissions = User.GetPermissions();

        return Ok(new { companyId, displayName, permissions });
    }

    /// <summary>
    /// List members of a company.
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyMembersView)]
    [HttpGet("companies/{companyId}/members")]
    public async Task<IActionResult> ListMembers(string companyId, CancellationToken ct)
    {
        List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);

        var result = members.Select(m => new
        {
            profileId = m.Id,
            keycloakUserId = m.KeycloakUserId,
            email = m.Email,
            displayName = m.DisplayName,
            roleId = m.RoleId,
            roleName = m.RoleName,
            permissions = m.Permissions,
            isActive = m.IsActive,
            createdTimestamp = m.CreatedTimestamp,
            lastLoginTimestamp = m.LastLoginTimestamp
        });

        return Ok(result);
    }

    /// <summary>
    /// Add a member to a company by email. Looks up the Keycloak user and assigns a role.
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    [HttpPost("companies/{companyId}/members")]
    public async Task<IActionResult> AddMember(
        string companyId,
        [FromBody] AddMemberRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Email is required." });
        if (string.IsNullOrWhiteSpace(request.RoleId))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "RoleId is required." });

        // Validate role exists and belongs to this company
        Role? role = await _roleRepo.GetByIdAsync(request.RoleId, ct);
        if (role is null || role.CompanyId != companyId)
            return BadRequest(new { error = "INVALID_ROLE", message = "Role not found." });

        // Check if already a member of this company
        UserProfile? existing = await _userProfileRepo.GetByEmailAsync(request.Email, ct);
        if (existing is not null && existing.CompanyId == companyId)
            return Conflict(new { error = "ALREADY_MEMBER", message = "This user is already a member of the company." });

        // Look up user in Keycloak
        Result<KeycloakUser?> keycloakResult = await _keycloakAdmin.GetUserByEmailAsync(request.Email, ct);
        if (keycloakResult is Result<KeycloakUser?>.Failure failure)
            return StatusCode(500, new { error = failure.Error.Code, message = failure.Error.Message });

        KeycloakUser? keycloakUser = ((Result<KeycloakUser?>.Success)keycloakResult).Value;
        if (keycloakUser is null)
            return NotFound(new { error = "USER_NOT_FOUND", message = "No Keycloak user found with this email." });

        long now = DateTimeHelper.NowUnixMilliseconds();

        UserProfile profile = new()
        {
            KeycloakUserId = keycloakUser.Id,
            Email = request.Email,
            DisplayName = keycloakUser.FirstName ?? request.Email,
            CompanyId = companyId,
            RoleId = role.Id,
            RoleName = role.Name,
            Permissions = role.Permissions,
            IsActive = true,
            CreatedTimestamp = now
        };

        await _userProfileRepo.CreateAsync(profile, ct);

        _logger.LogInformation("Added member {Email} to company {CompanyId} with role {RoleName}", request.Email, companyId, role.Name);

        return Ok(new
        {
            profileId = profile.Id,
            email = profile.Email,
            displayName = profile.DisplayName,
            roleId = profile.RoleId,
            roleName = profile.RoleName,
            permissions = profile.Permissions,
            isActive = profile.IsActive
        });
    }

    /// <summary>
    /// Update a member's role. Permissions are derived from the role.
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    [HttpPut("companies/{companyId}/members/{profileId}")]
    public async Task<IActionResult> UpdateMember(
        string companyId,
        string profileId,
        [FromBody] UpdateMemberRequest request,
        CancellationToken ct)
    {
        List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);
        UserProfile? profile = members.FirstOrDefault(m => m.Id == profileId);

        if (profile is null)
            return NotFound(new { error = "MEMBER_NOT_FOUND", message = "Member not found in this company." });

        // If roleId is changing, look up the new role and sync permissions
        if (request.RoleId is not null)
        {
            Role? role = await _roleRepo.GetByIdAsync(request.RoleId, ct);
            if (role is null || role.CompanyId != companyId)
                return BadRequest(new { error = "INVALID_ROLE", message = "Role not found." });

            profile.RoleId = role.Id;
            profile.RoleName = role.Name;
            profile.Permissions = role.Permissions;
        }

        await _userProfileRepo.UpdateAsync(profile, ct);

        // Invalidate cache so middleware picks up updated permissions
        await _cacheService.RemoveAsync($"userprofile:{profile.KeycloakUserId}", ct);

        _logger.LogInformation("Updated member {ProfileId} in company {CompanyId}", profileId, companyId);

        return Ok(new
        {
            profileId = profile.Id,
            email = profile.Email,
            displayName = profile.DisplayName,
            roleId = profile.RoleId,
            roleName = profile.RoleName,
            permissions = profile.Permissions,
            isActive = profile.IsActive
        });
    }

    /// <summary>
    /// Deactivate a member (soft delete).
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyMembersManage)]
    [HttpDelete("companies/{companyId}/members/{profileId}")]
    public async Task<IActionResult> DeactivateMember(
        string companyId,
        string profileId,
        CancellationToken ct)
    {
        List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);
        UserProfile? profile = members.FirstOrDefault(m => m.Id == profileId);

        if (profile is null)
            return NotFound(new { error = "MEMBER_NOT_FOUND", message = "Member not found in this company." });

        if (profile.RoleName == "owner")
            return BadRequest(new { error = "CANNOT_DEACTIVATE_OWNER", message = "Cannot deactivate the company owner." });

        profile.IsActive = false;
        await _userProfileRepo.UpdateAsync(profile, ct);

        // Invalidate cache
        await _cacheService.RemoveAsync($"userprofile:{profile.KeycloakUserId}", ct);

        _logger.LogInformation("Deactivated member {ProfileId} in company {CompanyId}", profileId, companyId);

        return NoContent();
    }
}

// Request DTOs
public record RegisterRequest
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string CompanyName { get; init; } = "";
}

public record AddMemberRequest
{
    public string Email { get; init; } = "";
    public string RoleId { get; init; } = "";
}

public record UpdateMemberRequest
{
    public string? RoleId { get; init; }
}

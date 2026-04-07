using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Application.Auth;
using OneBear.Application.Auth.Services;
using OneBear.Application.Common;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
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
    private readonly ICacheService _cacheService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        KeycloakAdminService keycloakAdmin,
        IUserProfileRepository userProfileRepo,
        ICompanyFeatureSettingsRepository companySettingsRepo,
        ICacheService cacheService,
        ILogger<AuthController> logger)
    {
        _keycloakAdmin = keycloakAdmin;
        _userProfileRepo = userProfileRepo;
        _companySettingsRepo = companySettingsRepo;
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
        string companyId = Guid.NewGuid().ToString();
        long now = DateTimeHelper.NowUnixMilliseconds();

        // Create CompanyFeatureSettings for the new company
        CompanyFeatureSettings companySettings = new()
        {
            CompanyId = companyId,
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
            CompanyId = companyId,
            RoleId = "",
            RoleName = "owner",
            Permissions = [3001, 3002, 3003, 3004, 3005],
            IsActive = true,
            CreatedTimestamp = now
        };
        await _userProfileRepo.CreateAsync(profile, ct);

        _logger.LogInformation(
            "Registered new account: {Email}, CompanyId: {CompanyId}, KeycloakUserId: {KeycloakUserId}",
            request.Email, companyId, keycloakUserId);

        return Ok(new
        {
            profileId = profile.Id,
            companyId,
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
    [Authorize(Policy = AuthConstants.PolicyChatAdmin)]
    [HttpGet("companies/{companyId}/members")]
    public async Task<IActionResult> ListMembers(string companyId, CancellationToken ct)
    {
        List<UserProfile> members = await _userProfileRepo.GetByCompanyIdAsync(companyId, ct);

        var result = members.Select(m => new
        {
            profileId = m.Id,
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
    /// Add a member to a company by email. Looks up the Keycloak user first.
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyChatAdmin)]
    [HttpPost("companies/{companyId}/members")]
    public async Task<IActionResult> AddMember(
        string companyId,
        [FromBody] AddMemberRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { error = "VALIDATION_ERROR", message = "Email is required." });

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
            RoleId = request.RoleId ?? "",
            RoleName = request.RoleName ?? "member",
            Permissions = request.Permissions ?? [3001],
            IsActive = true,
            CreatedTimestamp = now
        };

        await _userProfileRepo.CreateAsync(profile, ct);

        _logger.LogInformation("Added member {Email} to company {CompanyId}", request.Email, companyId);

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
    /// Update a member's permissions and/or role.
    /// </summary>
    [Authorize(Policy = AuthConstants.PolicyChatAdmin)]
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

        if (request.RoleId is not null)
            profile.RoleId = request.RoleId;

        if (request.RoleName is not null)
            profile.RoleName = request.RoleName;

        if (request.Permissions is not null)
            profile.Permissions = request.Permissions;

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
    [Authorize(Policy = AuthConstants.PolicyChatAdmin)]
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
    public string? RoleId { get; init; }
    public string? RoleName { get; init; }
    public List<int>? Permissions { get; init; }
}

public record UpdateMemberRequest
{
    public string? RoleId { get; init; }
    public string? RoleName { get; init; }
    public List<int>? Permissions { get; init; }
}

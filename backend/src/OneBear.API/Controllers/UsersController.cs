using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/users")]
[Authorize]
[EnableRateLimiting("api")]
public class UsersController : ControllerBase
{
    private readonly IChatUserRepository _userRepo;

    public UsersController(IChatUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    /// <summary>Get current authenticated user profile.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(string companyId, CancellationToken ct)
    {
        string userId = User.GetUserId();
        ChatUser? user = await _userRepo.GetByIdAsync(userId, companyId, ct);

        if (user is null)
        {
            // Return basic info from JWT claims
            return Ok(new
            {
                id = userId,
                companyId,
                displayName = User.GetDisplayName() ?? "Unknown",
                email = User.GetEmail(),
                type = "Agent",
                isActive = true
            });
        }

        return Ok(new
        {
            id = user.Id,
            companyId = user.CompanyId,
            displayName = user.DisplayName,
            pictureUrl = user.PictureUrl,
            type = user.Type,
            isActive = user.IsActive,
            createdTimestamp = user.CreatedTimestamp
        });
    }

    /// <summary>List agents in the company.</summary>
    [HttpGet]
    public async Task<IActionResult> ListUsers(
        string companyId,
        [FromQuery] string? type = "Agent",
        [FromQuery] int pageSize = 50,
        [FromQuery] string? continuationToken = null,
        CancellationToken ct = default)
    {
        (List<ChatUser> users, string? nextToken) =
            await _userRepo.QueryByTypeAsync(companyId, type ?? "Agent", pageSize, continuationToken, ct);

        var dtos = users.Select(u => new
        {
            id = u.Id,
            displayName = u.DisplayName,
            pictureUrl = u.PictureUrl,
            type = u.Type,
            isActive = u.IsActive
        }).ToList();

        return Ok(new { data = dtos, continuationToken = nextToken, hasMore = !string.IsNullOrEmpty(nextToken) });
    }
}

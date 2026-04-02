using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/users")]
[Authorize]
[EnableRateLimiting("api")]
public class UsersController : ControllerBase
{
    /// <summary>Upsert a user (create or update).</summary>
    [HttpPost]
    public IActionResult UpsertUser(string companyId)
    {
        return Ok(new
        {
            id = Guid.NewGuid().ToString(),
            companyId,
            displayName = "",
            email = "",
            role = "agent",
            status = "active",
            createdAt = DateTimeOffset.UtcNow,
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Get current authenticated user profile.</summary>
    [HttpGet("me")]
    public IActionResult GetMe(string companyId)
    {
        return Ok(new
        {
            id = "stub-user-id",
            companyId,
            displayName = "Stub User",
            email = "stub@example.com",
            role = "agent",
            status = "active",
            avatarUrl = (string?)null,
            createdAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Get notification preferences for current user.</summary>
    [HttpGet("me/notifications")]
    public IActionResult GetNotifications(string companyId)
    {
        return Ok(new
        {
            companyId,
            email = true,
            push = true,
            sound = true,
            newMessage = true,
            newRoom = true,
            mention = true
        });
    }

    /// <summary>Update notification preferences for current user.</summary>
    [HttpPut("me/notifications")]
    public IActionResult UpdateNotifications(string companyId)
    {
        return Ok(new
        {
            companyId,
            email = true,
            push = true,
            sound = true,
            newMessage = true,
            newRoom = true,
            mention = true,
            updatedAt = DateTimeOffset.UtcNow
        });
    }
}

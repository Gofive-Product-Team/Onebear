using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/rooms")]
[Authorize]
[EnableRateLimiting("api")]
public class RoomsController : ControllerBase
{
    /// <summary>List rooms with pagination.</summary>
    [HttpGet]
    public IActionResult ListRooms(
        string companyId,
        [FromQuery] string? continuationToken = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? platform = null,
        [FromQuery] string? assigneeId = null)
    {
        return Ok(new { data = Array.Empty<object>(), continuationToken = (string?)null, hasMore = false });
    }

    /// <summary>Search rooms.</summary>
    [HttpPost("search")]
    public IActionResult SearchRooms(string companyId)
    {
        return Ok(new { data = Array.Empty<object>(), continuationToken = (string?)null, hasMore = false });
    }

    /// <summary>Get badge (unread) counts.</summary>
    [HttpGet("badge-count")]
    public IActionResult GetBadgeCount(string companyId)
    {
        return Ok(new { total = 0, unassigned = 0, mine = 0, followUp = 0 });
    }

    /// <summary>Get a single room by ID.</summary>
    [HttpGet("{roomId}")]
    public IActionResult GetRoom(string companyId, string roomId)
    {
        return Ok(new
        {
            id = roomId,
            companyId,
            status = "open",
            platform = "line",
            customer = new { id = (string?)null, displayName = "Stub Customer" },
            assignee = (object?)null,
            tags = Array.Empty<string>(),
            participants = Array.Empty<object>(),
            followUp = (DateTimeOffset?)null,
            createdAt = DateTimeOffset.UtcNow,
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Get unresolved items for a room.</summary>
    [HttpGet("{roomId}/unresolved")]
    public IActionResult GetUnresolved(string companyId, string roomId)
    {
        return Ok(new { data = Array.Empty<object>(), count = 0 });
    }

    /// <summary>Resolve a room.</summary>
    [HttpPost("{roomId}/resolve")]
    public IActionResult ResolveRoom(string companyId, string roomId)
    {
        return Ok(new { id = roomId, status = "resolved", resolvedAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Close a room.</summary>
    [HttpPost("{roomId}/close")]
    public IActionResult CloseRoom(string companyId, string roomId)
    {
        return Ok(new { id = roomId, status = "closed", closedAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Reopen a room.</summary>
    [HttpPost("{roomId}/reopen")]
    public IActionResult ReopenRoom(string companyId, string roomId)
    {
        return Ok(new { id = roomId, status = "open", reopenedAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Update room assignment.</summary>
    [HttpPut("{roomId}/assignment")]
    public IActionResult UpdateAssignment(string companyId, string roomId)
    {
        return Ok(new { id = roomId, assignee = new { id = "stub-user", displayName = "Stub User" } });
    }

    /// <summary>Update room follow-up date.</summary>
    [HttpPut("{roomId}/follow-up")]
    public IActionResult UpdateFollowUp(string companyId, string roomId)
    {
        return Ok(new { id = roomId, followUp = DateTimeOffset.UtcNow.AddDays(1) });
    }

    /// <summary>Update customer linked to a room.</summary>
    [HttpPatch("{roomId}/customer")]
    public IActionResult UpdateRoomCustomer(string companyId, string roomId)
    {
        return Ok(new { id = roomId, customer = new { id = "stub-customer", displayName = "Updated Customer" } });
    }

    /// <summary>Update room tags.</summary>
    [HttpPut("{roomId}/tags")]
    public IActionResult UpdateTags(string companyId, string roomId)
    {
        return Ok(new { id = roomId, tags = new[] { "vip", "urgent" } });
    }

    /// <summary>Update room participants.</summary>
    [HttpPut("{roomId}/participants")]
    public IActionResult UpdateParticipants(string companyId, string roomId)
    {
        return Ok(new { id = roomId, participants = Array.Empty<object>() });
    }

    /// <summary>Attend (join) a room for live presence.</summary>
    [HttpPost("{roomId}/attend")]
    public IActionResult AttendRoom(string companyId, string roomId)
    {
        return Ok(new { id = roomId, isAttending = true });
    }

    /// <summary>Exit a room presence.</summary>
    [HttpPost("{roomId}/exit")]
    public IActionResult ExitRoom(string companyId, string roomId)
    {
        return Ok(new { id = roomId, isAttending = false });
    }
}

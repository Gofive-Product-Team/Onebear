using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class MessagesController : ControllerBase
{
    /// <summary>List messages in a room with pagination.</summary>
    [HttpGet("api/v1/companies/{companyId}/rooms/{roomId}/messages")]
    public IActionResult ListMessages(
        string companyId,
        string roomId,
        [FromQuery] string? continuationToken = null,
        [FromQuery] int pageSize = 50)
    {
        return Ok(new { data = Array.Empty<object>(), continuationToken = (string?)null, hasMore = false });
    }

    /// <summary>Send a message to a room.</summary>
    [HttpPost("api/v1/companies/{companyId}/rooms/{roomId}/messages")]
    public IActionResult SendMessage(string companyId, string roomId)
    {
        return StatusCode(201, new
        {
            id = Guid.NewGuid().ToString(),
            roomId,
            companyId,
            type = "text",
            content = new { text = "" },
            sender = new { id = "stub-user", type = "agent" },
            createdAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Edit a message.</summary>
    [HttpPut("api/v1/companies/{companyId}/rooms/{roomId}/messages/{messageId}")]
    public IActionResult EditMessage(string companyId, string roomId, string messageId)
    {
        return Ok(new
        {
            id = messageId,
            roomId,
            companyId,
            type = "text",
            content = new { text = "" },
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Get a single message.</summary>
    [HttpGet("api/v1/companies/{companyId}/rooms/{roomId}/messages/{messageId}")]
    public IActionResult GetMessage(string companyId, string roomId, string messageId)
    {
        return Ok(new
        {
            id = messageId,
            roomId,
            companyId,
            type = "text",
            content = new { text = "" },
            sender = new { id = "stub-user", type = "agent" },
            createdAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Send a system (bot) message.</summary>
    [HttpPost("api/v1/companies/{companyId}/system-messages")]
    public IActionResult SendSystemMessage(string companyId)
    {
        return StatusCode(201, new
        {
            id = Guid.NewGuid().ToString(),
            companyId,
            type = "system",
            content = new { text = "" },
            sender = new { id = "system", type = "bot" },
            createdAt = DateTimeOffset.UtcNow
        });
    }
}

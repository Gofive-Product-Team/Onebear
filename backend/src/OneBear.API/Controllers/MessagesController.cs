using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Messaging;
using OneBear.Application.Rooms.Services;
using OneBear.Domain.Common;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class MessagesController : ControllerBase
{
    private readonly MessageOrchestrator _orchestrator;
    private readonly RoomQueryService _queryService;

    public MessagesController(MessageOrchestrator orchestrator, RoomQueryService queryService)
    {
        _orchestrator = orchestrator;
        _queryService = queryService;
    }

    /// <summary>List messages in a room with pagination.</summary>
    [HttpGet("api/v1/companies/{companyId}/rooms/{roomId}/messages")]
    public async Task<IActionResult> ListMessages(
        string companyId,
        string roomId,
        [FromQuery] string? continuationToken = null,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        Result<PagedResult<ChatMessageDto>> result =
            await _queryService.GetMessagesAsync(companyId, roomId, pageSize, continuationToken, ct);
        return result.ToActionResult();
    }

    /// <summary>Send a message to a room.</summary>
    [HttpPost("api/v1/companies/{companyId}/rooms/{roomId}/messages")]
    public async Task<IActionResult> SendMessage(
        string companyId,
        string roomId,
        [FromBody] SendMessageRequest request,
        CancellationToken ct = default)
    {
        string userId = User.GetUserId();

        Result<ChatMessageDto> result = await _orchestrator.ProcessOutboundAsync(
            userId, companyId, roomId, request.Content, request.MessageType, ct);

        return result switch
        {
            Result<ChatMessageDto>.Success s => StatusCode(201, s.Value),
            _ => result.ToActionResult()
        };
    }

    /// <summary>Get a single message.</summary>
    [HttpGet("api/v1/companies/{companyId}/rooms/{roomId}/messages/{messageId}")]
    public IActionResult GetMessage(string companyId, string roomId, string messageId)
    {
        // Message lookup by ID is rarely needed - returns stub for now
        return Ok(new { id = messageId, roomId, companyId });
    }
}

public record SendMessageRequest
{
    public string? Content { get; init; }
    public string? MessageType { get; init; }
}

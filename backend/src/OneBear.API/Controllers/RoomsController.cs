using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.API.Extensions;
using OneBear.Application.Common;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Application.Rooms.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

using ChatRoom = OneBear.Domain.Entities.ChatRoom;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/rooms")]
[Authorize]
[EnableRateLimiting("api")]
public class RoomsController : ControllerBase
{
    private readonly RoomQueryService _queryService;
    private readonly RoomParticipantService _participantService;
    private readonly BadgeService _badgeService;
    private readonly IRoomStateService _roomStateService;
    private readonly IChatRoomRepository _roomRepo;
    private readonly IChatMessageRepository _messageRepo;

    public RoomsController(
        RoomQueryService queryService,
        RoomParticipantService participantService,
        BadgeService badgeService,
        IRoomStateService roomStateService,
        IChatRoomRepository roomRepo,
        IChatMessageRepository messageRepo)
    {
        _queryService = queryService;
        _participantService = participantService;
        _badgeService = badgeService;
        _roomStateService = roomStateService;
        _roomRepo = roomRepo;
        _messageRepo = messageRepo;
    }

    /// <summary>List rooms with pagination, filtering, searching, and sorting.</summary>
    [HttpGet]
    public async Task<IActionResult> ListRooms(
        string companyId,
        [FromQuery] string? continuationToken = null,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? platform = null,
        [FromQuery] string? assigneeId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sort = null,
        CancellationToken ct = default)
    {
        RoomFilter filter = new()
        {
            State = status,
            Platform = platform,
            AssignToUserId = assigneeId,
            SearchQuery = search,
            Sort = sort
        };

        Result<PagedResult<ChatRoomDto>> result =
            await _queryService.ListRoomsAsync(companyId, filter, pageSize, continuationToken, ct);

        return result.ToActionResult();
    }

    /// <summary>Search rooms.</summary>
    [HttpPost("search")]
    public async Task<IActionResult> SearchRooms(
        string companyId,
        [FromBody] RoomSearchRequest request,
        CancellationToken ct = default)
    {
        RoomFilter filter = new()
        {
            SearchQuery = request.Query,
            State = request.Status,
            Platform = request.Platform,
            AssignToUserId = request.AssigneeId
        };

        Result<PagedResult<ChatRoomDto>> result =
            await _queryService.ListRoomsAsync(companyId, filter, request.PageSize, request.ContinuationToken, ct);

        return result.ToActionResult();
    }

    /// <summary>Get badge (unread) counts.</summary>
    [HttpGet("badge-count")]
    public async Task<IActionResult> GetBadgeCount(string companyId, CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        Result<BadgeCountResult> result = await _badgeService.GetBadgeCountAsync(companyId, userId, ct);
        return result.ToActionResult();
    }

    /// <summary>Get a single room by ID.</summary>
    [HttpGet("{roomId}")]
    public async Task<IActionResult> GetRoom(string companyId, string roomId, CancellationToken ct = default)
    {
        Result<ChatRoomDto> result = await _queryService.GetRoomByIdAsync(companyId, roomId, ct);
        return result.ToActionResult();
    }

    /// <summary>Resolve a room.</summary>
    [HttpPost("{roomId}/resolve")]
    public async Task<IActionResult> ResolveRoom(string companyId, string roomId, CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        Result<ChatRoom> result = await _roomStateService.TransitionToResolvedAsync(room, userId, ct);
        return result switch
        {
            Result<ChatRoom>.Success s => Ok(MessageMappingHelpers.ToDto(s.Value)),
            _ => result.ToActionResult()
        };
    }

    /// <summary>Close a room.</summary>
    [HttpPost("{roomId}/close")]
    public async Task<IActionResult> CloseRoom(string companyId, string roomId, CancellationToken ct = default)
    {
        string userId = User.GetUserId();
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        Result<ChatRoom> result = await _roomStateService.TransitionToClosedAsync(room, userId, ct);
        return result switch
        {
            Result<ChatRoom>.Success s => Ok(MessageMappingHelpers.ToDto(s.Value)),
            _ => result.ToActionResult()
        };
    }

    /// <summary>Reopen a room.</summary>
    [HttpPost("{roomId}/reopen")]
    public async Task<IActionResult> ReopenRoom(string companyId, string roomId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        Result<ChatRoom> result = await _roomStateService.ReopenRoomAsync(room, ct);
        return result switch
        {
            Result<ChatRoom>.Success s => Ok(MessageMappingHelpers.ToDto(s.Value)),
            _ => result.ToActionResult()
        };
    }

    /// <summary>Update room assignment.</summary>
    [HttpPut("{roomId}/assignment")]
    public async Task<IActionResult> UpdateAssignment(
        string companyId, string roomId,
        [FromBody] UpdateAssignmentRequest request,
        CancellationToken ct = default)
    {
        Result<ChatRoomDto> result =
            await _participantService.UpdateAssignmentAsync(companyId, roomId, request.AssignToUserId, ct);
        return result.ToActionResult();
    }

    /// <summary>Update room follow-up date.</summary>
    [HttpPut("{roomId}/follow-up")]
    public async Task<IActionResult> UpdateFollowUp(
        string companyId, string roomId,
        [FromBody] UpdateFollowUpRequest request,
        CancellationToken ct = default)
    {
        Result<ChatRoomDto> result =
            await _participantService.UpdateFollowUpAsync(companyId, roomId, request.FollowupTimestamp, request.Content, ct);
        return result.ToActionResult();
    }

    /// <summary>Update room tags.</summary>
    [HttpPut("{roomId}/tags")]
    public async Task<IActionResult> UpdateTags(
        string companyId, string roomId,
        [FromBody] UpdateTagsRequest request,
        CancellationToken ct = default)
    {
        Result<ChatRoomDto> result =
            await _participantService.UpdateTagsAsync(companyId, roomId, request.TagIds, ct);
        return result.ToActionResult();
    }

    /// <summary>Pin a room. Max 10 pinned rooms per company.</summary>
    [HttpPost("{roomId}/pin")]
    public async Task<IActionResult> PinRoom(string companyId, string roomId, CancellationToken ct)
    {
        string userId = User.GetUserId();
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        if (!room.IsPinned)
        {
            int pinnedCount = await _roomRepo.GetPinnedCountAsync(companyId, ct);
            if (pinnedCount >= 10)
                return Conflict(new { error = "MAX_PINNED_REACHED", message = "Maximum of 10 pinned rooms allowed per company." });
        }

        long now = DateTimeHelper.NowUnixMilliseconds();
        room.IsPinned = true;
        room.PinnedTimestamp = now;
        room.PinnedByUserId = userId;
        await _roomRepo.UpdateAsync(room, ct);

        return Ok(MessageMappingHelpers.ToDto(room));
    }

    /// <summary>Unpin a room.</summary>
    [HttpDelete("{roomId}/pin")]
    public async Task<IActionResult> UnpinRoom(string companyId, string roomId, CancellationToken ct)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        room.IsPinned = false;
        room.PinnedTimestamp = null;
        room.PinnedByUserId = null;
        await _roomRepo.UpdateAsync(room, ct);

        return NoContent();
    }

    /// <summary>Mark a room as Done — stops RT timer, records session timing, transitions to Resolved.</summary>
    [HttpPost("{roomId}/done")]
    public async Task<IActionResult> MarkDone(string companyId, string roomId, CancellationToken ct)
    {
        string userId = User.GetUserId();

        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        long now = DateTimeHelper.NowUnixMilliseconds();

        long rtDurationMs = room.FrtStartTimestamp.HasValue
            ? now - room.FrtStartTimestamp.Value
            : 0;

        SessionTimingSummaryDto summary;
        Result<ChatRoom> doneResult = await _roomStateService.UpdateRoomWithRetryAsync(room, r =>
        {
            r.RtEndTimestamp = now;
            r.RtDurationMs = rtDurationMs;
            r.IsResolved = true;
            r.State = ChatState.Resolved;
            r.UpdatedBy = userId;

            r.SessionTimings.Add(new SessionTiming
            {
                FrtMs = r.FrtDurationMs ?? 0,
                RtMs = rtDurationMs,
                ResolvedBy = userId,
                Timestamp = now
            });
        }, ct);

        if (doneResult is Result<ChatRoom>.Failure f)
            return f.Error.Type == ErrorType.NotFound ? NotFound() : Conflict(new { error = f.Error.Code, message = f.Error.Message });

        ChatRoom resolved = ((Result<ChatRoom>.Success)doneResult).Value;

        List<SessionTiming> timings = resolved.SessionTimings;
        summary = new SessionTimingSummaryDto
        {
            LatestFrtMs = resolved.FrtDurationMs,
            LatestRtMs = resolved.RtDurationMs,
            AverageFrtMs = timings.Count > 0 ? timings.Average(t => (double)t.FrtMs) : null,
            AverageRtMs = timings.Count > 0 ? timings.Average(t => (double)t.RtMs) : null,
            SessionCount = timings.Count
        };

        return Ok(summary);
    }

    /// <summary>Update room participants.</summary>
    [HttpPut("{roomId}/participants")]
    public async Task<IActionResult> UpdateParticipants(
        string companyId, string roomId,
        [FromBody] UpdateParticipantsRequest request,
        CancellationToken ct = default)
    {
        Result<ChatRoomDto> result =
            await _participantService.UpdateParticipantsAsync(companyId, roomId, request.ParticipantUserIds, ct);
        return result.ToActionResult();
    }

    /// <summary>Return a room to AI — clears handoff fields and re-enables AI replies.</summary>
    [HttpPost("{roomId}/return-to-ai")]
    public async Task<IActionResult> ReturnToAi(string companyId, string roomId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        room.HandoffSource = null;
        room.HandoffSourceName = null;
        room.HandoffTimestamp = null;
        room.IsAiMuted = false;

        await _roomRepo.UpdateAsync(room, ct);

        return Ok(MessageMappingHelpers.ToDto(room));
    }

    /// <summary>Pin a message within a thread. Max 20 pinned messages per room.</summary>
    [HttpPost("{roomId}/messages/{messageId}/pin")]
    public async Task<IActionResult> PinMessage(string companyId, string roomId, string messageId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound(new { error = "ROOM_NOT_FOUND", message = "Room not found." });

        OneBear.Domain.Entities.ChatMessage? message = await _messageRepo.GetByIdAsync(messageId, roomId, ct);
        if (message is null || message.RoomId != roomId)
            return NotFound(new { error = "MESSAGE_NOT_FOUND", message = "Message not found." });

        if (!message.IsPinnedByUser)
        {
            List<OneBear.Domain.Entities.ChatMessage> pinned = await _messageRepo.GetPinnedMessagesAsync(roomId, 20, ct);
            if (pinned.Count >= 20)
                return Conflict(new { error = "MAX_PINS_REACHED", message = "Maximum of 20 pinned messages per room." });
        }

        message.IsPinnedByUser = true;
        message.MessagePinnedTimestamp = DateTimeHelper.NowUnixMilliseconds();
        await _messageRepo.UpdateAsync(message, ct);

        return Ok(MessageMappingHelpers.ToDto(message));
    }

    /// <summary>Unpin a message within a thread.</summary>
    [HttpDelete("{roomId}/messages/{messageId}/pin")]
    public async Task<IActionResult> UnpinMessage(string companyId, string roomId, string messageId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound(new { error = "ROOM_NOT_FOUND", message = "Room not found." });

        OneBear.Domain.Entities.ChatMessage? message = await _messageRepo.GetByIdAsync(messageId, roomId, ct);
        if (message is null || message.RoomId != roomId)
            return NotFound(new { error = "MESSAGE_NOT_FOUND", message = "Message not found." });

        message.IsPinnedByUser = false;
        message.MessagePinnedTimestamp = null;
        await _messageRepo.UpdateAsync(message, ct);

        return NoContent();
    }

    /// <summary>List pinned messages in a room (max 20, sorted by pin time descending).</summary>
    [HttpGet("{roomId}/pinned-messages")]
    public async Task<IActionResult> ListPinnedMessages(string companyId, string roomId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound(new { error = "ROOM_NOT_FOUND", message = "Room not found." });

        List<OneBear.Domain.Entities.ChatMessage> pinned = await _messageRepo.GetPinnedMessagesAsync(roomId, 20, ct);
        List<ChatMessageDto> dtos = pinned.Select(m => MessageMappingHelpers.ToDto(m)).ToList();
        return Ok(dtos);
    }

    /// <summary>List spam rooms for the company.</summary>
    [HttpGet("spam")]
    public async Task<IActionResult> ListSpamRooms(
        string companyId,
        [FromQuery] string? continuationToken = null,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        RoomFilter filter = new() { State = ChatState.Spam };
        Result<PagedResult<ChatRoomDto>> result =
            await _queryService.ListRoomsAsync(companyId, filter, pageSize, continuationToken, ct);
        return result.ToActionResult();
    }

    /// <summary>Mark a spam room as not-spam — moves it back to inbox (New state).</summary>
    [HttpPost("{roomId}/not-spam")]
    public async Task<IActionResult> MarkNotSpam(string companyId, string roomId, CancellationToken ct = default)
    {
        ChatRoom? room = await _roomRepo.GetByIdAsync(roomId, companyId, ct);
        if (room is null)
            return NotFound();

        room.IsSpam = false;
        room.SpamScore = null;
        room.State = ChatState.New;
        await _roomRepo.UpdateAsync(room, ct);

        return Ok(MessageMappingHelpers.ToDto(room));
    }
}

// Request DTOs
public record RoomSearchRequest
{
    public string? Query { get; init; }
    public string? Status { get; init; }
    public string? Platform { get; init; }
    public string? AssigneeId { get; init; }
    public int PageSize { get; init; } = 20;
    public string? ContinuationToken { get; init; }
}

public record UpdateAssignmentRequest
{
    public string? AssignToUserId { get; init; }
}

public record UpdateFollowUpRequest
{
    public long? FollowupTimestamp { get; init; }
    public string? Content { get; init; }
}

public record UpdateTagsRequest
{
    public List<string> TagIds { get; init; } = new();
}

public record UpdateParticipantsRequest
{
    public List<string> ParticipantUserIds { get; init; } = new();
}

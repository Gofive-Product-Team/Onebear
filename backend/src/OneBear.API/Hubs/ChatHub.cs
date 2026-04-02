using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OneBear.API.Auth;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Application.RealTime.Dtos;
using OneBear.Domain.Common;

namespace OneBear.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    private readonly IRoomAuthorizationService _roomAuth;
    private readonly IAttendanceService _attendanceService;
    private readonly ITypingTracker _typingTracker;
    private readonly MessageOrchestrator _orchestrator;

    public ChatHub(
        ILogger<ChatHub> logger,
        IRoomAuthorizationService roomAuth,
        IAttendanceService attendanceService,
        ITypingTracker typingTracker,
        MessageOrchestrator orchestrator)
    {
        _logger = logger;
        _roomAuth = roomAuth;
        _attendanceService = attendanceService;
        _typingTracker = typingTracker;
        _orchestrator = orchestrator;
    }

    public override async Task OnConnectedAsync()
    {
        string userId = Context.User!.GetUserId();
        string companyId = Context.User!.GetCompanyId();
        string connectionId = Context.ConnectionId;

        // Auto-join user-specific and company-wide groups
        await Groups.AddToGroupAsync(connectionId, $"user:{userId}");
        await Groups.AddToGroupAsync(connectionId, $"company:{companyId}");

        _logger.LogInformation(
            "SignalR connected: UserId={UserId}, CompanyId={CompanyId}, ConnectionId={ConnectionId}",
            userId, companyId, connectionId);

        // Notify caller of successful connection
        await Clients.Caller.SendAsync("Connected", new ConnectedDto
        {
            UserId = userId,
            ConnectionId = connectionId,
            ServerTime = DateTimeOffset.UtcNow
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string userId = Context.User!.GetUserId();
        string companyId = Context.User!.GetCompanyId();
        string connectionId = Context.ConnectionId;
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";

        _logger.LogInformation(
            "SignalR disconnected: UserId={UserId}, CompanyId={CompanyId}, ConnectionId={ConnectionId}, Error={Error}",
            userId, companyId, connectionId, exception?.Message ?? "none");

        // Broadcast attendance exit for all rooms this connection was attending
        IReadOnlyList<string> attendedRooms = await _attendanceService.GetAttendedRoomsAsync(connectionId);
        foreach (string roomId in attendedRooms)
        {
            await Clients.Group($"room:{roomId}").SendAsync("AttendanceChanged", new AttendanceDto
            {
                UserId = userId,
                DisplayName = displayName,
                RoomId = roomId,
                IsAttending = false,
                ConnectionId = connectionId
            });
        }

        await _attendanceService.ExitAllRoomsForConnectionAsync(connectionId);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>Subscribe to one or more chat room groups.</summary>
    public async Task JoinRooms(string[] roomIds)
    {
        string userId = Context.User!.GetUserId();
        foreach (string roomId in roomIds)
        {
            bool canAccess = await _roomAuth.CanAccessRoomAsync(userId, roomId);
            if (!canAccess)
            {
                _logger.LogDebug("User {UserId} denied access to room:{RoomId} — skipping join", userId, roomId);
                continue;
            }
            await Groups.AddToGroupAsync(Context.ConnectionId, $"room:{roomId}");
            _logger.LogDebug("User {UserId} joined room:{RoomId}", userId, roomId);
        }
    }

    /// <summary>Unsubscribe from a chat room group.</summary>
    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room:{roomId}");
    }

    /// <summary>Signal active viewing of a room (presence).</summary>
    public async Task AttendRoom(string roomId)
    {
        string userId = Context.User!.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";
        string connectionId = Context.ConnectionId;

        bool canAccess = await _roomAuth.CanAccessRoomAsync(userId, roomId);
        if (!canAccess)
        {
            throw new HubException($"Access denied to room {roomId}");
        }

        await Groups.AddToGroupAsync(connectionId, $"presence:{roomId}");
        await _attendanceService.RecordAttendAsync(connectionId, roomId, userId);

        await Clients.Group($"room:{roomId}").SendAsync("AttendanceChanged", new AttendanceDto
        {
            UserId = userId,
            DisplayName = displayName,
            RoomId = roomId,
            IsAttending = true,
            ConnectionId = connectionId
        });

        _logger.LogDebug("User {UserId} attending room {RoomId}", userId, roomId);
    }

    /// <summary>Signal stop viewing a room.</summary>
    public async Task ExitRoom(string roomId)
    {
        string userId = Context.User!.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";
        string connectionId = Context.ConnectionId;

        await Groups.RemoveFromGroupAsync(connectionId, $"presence:{roomId}");
        await _attendanceService.RecordExitAsync(connectionId, roomId);

        await Clients.Group($"room:{roomId}").SendAsync("AttendanceChanged", new AttendanceDto
        {
            UserId = userId,
            DisplayName = displayName,
            RoomId = roomId,
            IsAttending = false,
            ConnectionId = connectionId
        });
    }

    /// <summary>Agent sends a message. Delegates to MessageOrchestrator.</summary>
    public async Task SendMessage(SendMessagePayload payload)
    {
        string userId = Context.User!.GetUserId();
        string companyId = Context.User!.GetCompanyId();

        bool canAccess = await _roomAuth.CanAccessRoomAsync(userId, payload.RoomId);
        if (!canAccess)
        {
            throw new HubException($"Access denied to room {payload.RoomId}");
        }

        _logger.LogInformation("SendMessage from {UserId} to room {RoomId}", userId, payload.RoomId);

        // ProcessOutboundAsync handles: persist, send to platform, update status, broadcast via SignalR
        Result<ChatMessageDto> result = await _orchestrator.ProcessOutboundAsync(
            userId, companyId, payload.RoomId, payload.Content, payload.MessageType, CancellationToken.None);

        if (result is Result<ChatMessageDto>.Failure failure)
        {
            _logger.LogWarning("SendMessage failed for room {RoomId}: {Error}",
                payload.RoomId, failure.Error.Message);
            throw new HubException(failure.Error.Message);
        }
    }

    /// <summary>Typing indicator with server-side relay.</summary>
    public async Task SendTyping(string roomId, bool isTyping)
    {
        string userId = Context.User!.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";

        bool canAccess = await _roomAuth.CanAccessRoomAsync(userId, roomId);
        if (!canAccess)
        {
            // Silently skip — typing from unauthorized room should not throw
            return;
        }

        _typingTracker.Track(userId, roomId, isTyping);

        await Clients.OthersInGroup($"room:{roomId}").SendAsync("TypingIndicator", new TypingIndicatorDto
        {
            UserId = userId,
            DisplayName = displayName,
            RoomId = roomId,
            IsTyping = isTyping
        });
    }
}

/// <summary>Payload for SendMessage hub method.</summary>
public class SendMessagePayload
{
    public string RoomId { get; set; } = default!;
    public string? Content { get; set; }
    public string? MessageType { get; set; }
    public string? AttachmentId { get; set; }
    public string[]? MentionedUserIds { get; set; }
}

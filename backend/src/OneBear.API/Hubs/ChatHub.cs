using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OneBear.API.Auth;

namespace OneBear.API.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        string userId = Context.User?.GetUserId() ?? "anonymous";
        string companyId = Context.User?.GetCompanyId() ?? "unknown";
        string connectionId = Context.ConnectionId;

        // Auto-join user-specific and company-wide groups
        await Groups.AddToGroupAsync(connectionId, $"user:{userId}");
        await Groups.AddToGroupAsync(connectionId, $"company:{companyId}");

        _logger.LogInformation(
            "SignalR connected: UserId={UserId}, CompanyId={CompanyId}, ConnectionId={ConnectionId}",
            userId, companyId, connectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string userId = Context.User?.GetUserId() ?? "anonymous";
        string companyId = Context.User?.GetCompanyId() ?? "unknown";
        string connectionId = Context.ConnectionId;

        // Groups are auto-cleaned by SignalR on disconnect, but we log it
        _logger.LogInformation(
            "SignalR disconnected: UserId={UserId}, CompanyId={CompanyId}, ConnectionId={ConnectionId}, Error={Error}",
            userId, companyId, connectionId, exception?.Message ?? "none");

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>Subscribe to one or more chat room groups.</summary>
    public async Task JoinRooms(string[] roomIds)
    {
        string? userId = Context.User?.GetUserId();
        // TODO: validate user has access to each room (participant check or Chat.Admin)
        foreach (string roomId in roomIds)
        {
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
        string? userId = Context.User?.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";

        await Groups.AddToGroupAsync(Context.ConnectionId, $"presence:{roomId}");
        await Clients.Group($"room:{roomId}").SendAsync("AttendanceChanged", new
        {
            roomId,
            userId,
            displayName,
            isAttending = true,
            timestamp = DateTimeOffset.UtcNow
        });

        _logger.LogDebug("User {UserId} attending room {RoomId}", userId, roomId);
    }

    /// <summary>Signal stop viewing a room.</summary>
    public async Task ExitRoom(string roomId)
    {
        string? userId = Context.User?.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"presence:{roomId}");
        await Clients.Group($"room:{roomId}").SendAsync("AttendanceChanged", new
        {
            roomId,
            userId,
            displayName,
            isAttending = false,
            timestamp = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Agent sends a message. Delegates to MessageOrchestrator.</summary>
    public async Task SendMessage(SendMessagePayload payload)
    {
        string? userId = Context.User?.GetUserId();
        string? companyId = Context.User?.GetCompanyId();

        _logger.LogInformation("SendMessage from {UserId} to room {RoomId}", userId, payload.RoomId);

        // TODO: delegate to MessageOrchestrator.ProcessOutboundAsync()
        // For now, echo back to the room as acknowledgment
        await Clients.Group($"room:{payload.RoomId}").SendAsync("ReceiveMessage", new
        {
            id = Guid.NewGuid().ToString(),
            roomId = payload.RoomId,
            content = payload.Content,
            messageType = payload.MessageType ?? "Text",
            sender = new { id = userId, displayName = Context.User?.GetDisplayName(), type = "Agent" },
            deliveryStatus = "Pending",
            platform = "internal",
            sentAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Typing indicator with server-side relay.</summary>
    public async Task SendTyping(string roomId, bool isTyping)
    {
        string? userId = Context.User?.GetUserId();
        string displayName = Context.User?.GetDisplayName() ?? "Unknown";

        await Clients.OthersInGroup($"room:{roomId}").SendAsync("TypingIndicator", new
        {
            roomId,
            userId,
            displayName,
            isTyping,
            timestamp = DateTimeOffset.UtcNow
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

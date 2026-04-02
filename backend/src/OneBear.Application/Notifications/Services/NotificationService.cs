namespace OneBear.Application.Notifications.Services;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Interfaces;
using OneBear.Domain.ValueObjects;

public class NotificationService
{
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ISignalRNotifier signalRNotifier,
        ILogger<NotificationService> logger)
    {
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    /// <summary>
    /// Routes a new message notification to the assigned agent and all participants.
    /// </summary>
    public async Task NotifyNewMessageAsync(
        string roomId, string companyId,
        string? assignedUserId, List<string> participantUserIds,
        string messageContent, string senderDisplayName, string platform,
        CancellationToken ct)
    {
        object payload = new
        {
            type = "new_message",
            roomId,
            companyId,
            messagePreview = Truncate(messageContent, 100),
            senderDisplayName,
            platform,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        HashSet<string> notifiedUserIds = new();

        // Notify assigned agent first
        if (!string.IsNullOrEmpty(assignedUserId))
        {
            await _signalRNotifier.SendToUserAsync(assignedUserId, "Notification", payload, ct);
            notifiedUserIds.Add(assignedUserId);
        }

        // Notify all participants (dedup against assigned)
        foreach (string participantId in participantUserIds)
        {
            if (notifiedUserIds.Add(participantId))
            {
                await _signalRNotifier.SendToUserAsync(participantId, "Notification", payload, ct);
            }
        }

        _logger.LogDebug("Sent new_message notification for room {RoomId} to {Count} users",
            roomId, notifiedUserIds.Count);
    }

    /// <summary>
    /// Notifies users when they are mentioned in a message.
    /// </summary>
    public async Task NotifyMentionAsync(
        string roomId, string companyId,
        List<string> mentionedUserIds, string messageContent, string senderDisplayName,
        CancellationToken ct)
    {
        if (mentionedUserIds.Count == 0)
            return;

        object payload = new
        {
            type = "mention",
            roomId,
            companyId,
            messagePreview = Truncate(messageContent, 100),
            senderDisplayName,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        foreach (string userId in mentionedUserIds)
        {
            await _signalRNotifier.SendToUserAsync(userId, "Notification", payload, ct);
        }

        _logger.LogDebug("Sent mention notification for room {RoomId} to {Count} users",
            roomId, mentionedUserIds.Count);
    }

    /// <summary>
    /// Notifies the assigned agent about a follow-up reminder.
    /// </summary>
    public async Task NotifyFollowUpReminderAsync(
        string roomId, string companyId, string assignedUserId,
        string? followupContent, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(assignedUserId))
            return;

        object payload = new
        {
            type = "followup_reminder",
            roomId,
            companyId,
            content = followupContent ?? "Follow-up reminder",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await _signalRNotifier.SendToUserAsync(assignedUserId, "Notification", payload, ct);

        _logger.LogDebug("Sent follow-up reminder for room {RoomId} to user {UserId}",
            roomId, assignedUserId);
    }

    /// <summary>
    /// Notifies a user when a room is assigned to them.
    /// </summary>
    public async Task NotifyRoomAssignedAsync(
        string roomId, string companyId, string assignedUserId,
        string? assignedByDisplayName, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(assignedUserId))
            return;

        object payload = new
        {
            type = "room_assigned",
            roomId,
            companyId,
            assignedBy = assignedByDisplayName ?? "System",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        await _signalRNotifier.SendToUserAsync(assignedUserId, "Notification", payload, ct);

        _logger.LogDebug("Sent room_assigned notification for room {RoomId} to user {UserId}",
            roomId, assignedUserId);
    }

    private static string Truncate(string? text, int maxLength)
    {
        if (string.IsNullOrEmpty(text))
            return "";
        return text.Length <= maxLength ? text : text[..maxLength] + "...";
    }
}

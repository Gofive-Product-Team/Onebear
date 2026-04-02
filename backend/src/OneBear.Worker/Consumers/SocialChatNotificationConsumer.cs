namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Interfaces;

public class SocialChatNotificationConsumer : IConsumer<SocialChatNotification>
{
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<SocialChatNotificationConsumer> _logger;

    public SocialChatNotificationConsumer(
        ISignalRNotifier signalRNotifier,
        ILogger<SocialChatNotificationConsumer> logger)
    {
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SocialChatNotification> context)
    {
        SocialChatNotification msg = context.Message;
        CancellationToken ct = context.CancellationToken;

        _logger.LogInformation("Processing notification for room {RoomId}, message {MessageId}",
            msg.RoomId, msg.MessageId);

        object notificationPayload = new
        {
            roomId = msg.RoomId,
            messageId = msg.MessageId,
            content = msg.MessageContent,
            senderName = msg.SenderDisplayName,
            platform = msg.Platform
        };

        // Notify assigned user
        if (!string.IsNullOrEmpty(msg.AssignedUserId))
        {
            await _signalRNotifier.SendToUserAsync(
                msg.AssignedUserId, "Notification", notificationPayload, ct);
        }

        // Notify all participants
        foreach (string participantId in msg.ParticipantUserIds)
        {
            if (participantId == msg.AssignedUserId)
                continue; // Don't double-notify the assigned user

            await _signalRNotifier.SendToUserAsync(
                participantId, "Notification", notificationPayload, ct);
        }

        _logger.LogDebug("Notifications sent for room {RoomId}: assigned={AssignedUser}, participants={Count}",
            msg.RoomId, msg.AssignedUserId ?? "none", msg.ParticipantUserIds.Count);
    }
}

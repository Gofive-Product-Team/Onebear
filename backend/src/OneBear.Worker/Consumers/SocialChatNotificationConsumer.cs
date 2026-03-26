namespace OneBear.Worker.Consumers;

using MassTransit;

public record SocialChatNotification(string RoomId, string CompanyId, string NotificationType);

public class SocialChatNotificationConsumer : IConsumer<SocialChatNotification>
{
    public Task Consume(ConsumeContext<SocialChatNotification> context)
    {
        // TODO: implement social chat notification logic
        return Task.CompletedTask;
    }
}

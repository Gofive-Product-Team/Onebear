namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class SocialChatNotificationConsumer : IConsumer<SocialChatNotification>
{
    public Task Consume(ConsumeContext<SocialChatNotification> context)
    {
        // TODO: implement notification routing logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class SendAutoReplyMessageConsumer : IConsumer<SendAutoReplyMessage>
{
    public Task Consume(ConsumeContext<SendAutoReplyMessage> context)
    {
        // TODO: implement auto-reply message logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

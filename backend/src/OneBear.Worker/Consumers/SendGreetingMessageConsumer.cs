namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class SendGreetingMessageConsumer : IConsumer<SendGreetingMessage>
{
    public Task Consume(ConsumeContext<SendGreetingMessage> context)
    {
        // TODO: implement greeting message logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class WebhookIntegrationConsumer : IConsumer<WebhookIntegration>
{
    public Task Consume(ConsumeContext<WebhookIntegration> context)
    {
        // TODO: implement webhook integration processing logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

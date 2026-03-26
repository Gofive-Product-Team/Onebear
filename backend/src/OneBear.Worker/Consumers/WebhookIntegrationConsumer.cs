namespace OneBear.Worker.Consumers;

using MassTransit;

public record WebhookIntegration(string Platform, string CompanyId, string Payload);

public class WebhookIntegrationConsumer : IConsumer<WebhookIntegration>
{
    public Task Consume(ConsumeContext<WebhookIntegration> context)
    {
        // TODO: implement webhook integration processing logic
        return Task.CompletedTask;
    }
}

namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;

public class WebhookIntegrationConsumer : IConsumer<WebhookIntegration>
{
    private readonly ILogger<WebhookIntegrationConsumer> _logger;

    public WebhookIntegrationConsumer(ILogger<WebhookIntegrationConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<WebhookIntegration> context)
    {
        WebhookIntegration msg = context.Message;

        _logger.LogInformation(
            "Webhook event {EventType} for room {RoomId} on {Platform}. " +
            "External webhook delivery pending subscriber configuration.",
            msg.EventType, msg.RoomId, msg.Platform);

        // External webhook integration requires webhook subscriber configuration.
        // When configured, this consumer will:
        // 1. Query configured webhook subscriber URLs for this company
        // 2. POST the payload to each subscriber
        // 3. Retry with exponential backoff on failure
        // 4. Dead-letter after max retries

        return Task.CompletedTask;
    }
}

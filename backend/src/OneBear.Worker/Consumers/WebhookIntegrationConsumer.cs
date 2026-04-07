namespace OneBear.Worker.Consumers;

using System.Net.Http.Json;
using System.Text.Json;
using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class WebhookIntegrationConsumer : IConsumer<WebhookIntegration>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IIntegrationChannelRepository _integrationRepo;
    private readonly ILogger<WebhookIntegrationConsumer> _logger;

    public WebhookIntegrationConsumer(
        IHttpClientFactory httpClientFactory,
        IIntegrationChannelRepository integrationRepo,
        ILogger<WebhookIntegrationConsumer> logger)
    {
        _httpClientFactory = httpClientFactory;
        _integrationRepo = integrationRepo;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<WebhookIntegration> context)
    {
        WebhookIntegration msg = context.Message;
        CancellationToken ct = context.CancellationToken;

        _logger.LogInformation(
            "Processing webhook event {EventType} for room {RoomId} on {Platform}",
            msg.EventType, msg.RoomId, msg.Platform);

        // Get integration to check for webhook subscriber URLs
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(
            msg.MessageId, msg.CompanyId, ct);

        // Check PlatformSettings for webhook subscribers
        List<string> subscriberUrls = GetWebhookSubscriberUrls(integration);

        if (subscriberUrls.Count == 0)
        {
            _logger.LogDebug(
                "No webhook subscribers configured for company {CompanyId}. Skipping delivery.",
                msg.CompanyId);
            return;
        }

        // Build webhook payload
        object webhookPayload = new
        {
            eventType = msg.EventType,
            roomId = msg.RoomId,
            companyId = msg.CompanyId,
            messageId = msg.MessageId,
            platform = msg.Platform,
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            payload = msg.Payload
        };

        HttpClient client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        int delivered = 0;
        int failed = 0;

        // Deliver to each subscriber URL
        foreach (string url in subscriberUrls)
        {
            try
            {
                HttpResponseMessage response = await client.PostAsJsonAsync(url, webhookPayload, ct);

                if (response.IsSuccessStatusCode)
                {
                    delivered++;
                    _logger.LogDebug("Delivered webhook to {Url} for room {RoomId}", url, msg.RoomId);
                }
                else
                {
                    failed++;
                    _logger.LogWarning(
                        "Webhook delivery to {Url} returned {StatusCode} for room {RoomId}",
                        url, response.StatusCode, msg.RoomId);
                }
            }
            catch (HttpRequestException ex)
            {
                failed++;
                _logger.LogWarning(ex,
                    "Webhook delivery to {Url} failed for room {RoomId}",
                    url, msg.RoomId);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                failed++;
                _logger.LogWarning("Webhook delivery to {Url} timed out for room {RoomId}",
                    url, msg.RoomId);
            }
        }

        if (failed > 0)
        {
            _logger.LogWarning(
                "Webhook delivery completed with failures: {Delivered} delivered, {Failed} failed for room {RoomId}",
                delivered, failed, msg.RoomId);

            // Throw to trigger MassTransit retry if ALL deliveries failed
            if (delivered == 0)
                throw new InvalidOperationException(
                    $"All {failed} webhook deliveries failed for room {msg.RoomId}");
        }
        else
        {
            _logger.LogInformation(
                "All {Delivered} webhooks delivered for room {RoomId}",
                delivered, msg.RoomId);
        }
    }

    private static List<string> GetWebhookSubscriberUrls(IntegrationChannel? integration)
    {
        List<string> urls = new();

        if (integration?.PlatformSettings is null)
            return urls;

        if (integration.PlatformSettings.TryGetValue("webhookSubscriberUrls", out object? value))
        {
            if (value is JsonElement jsonElement && jsonElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement urlElement in jsonElement.EnumerateArray())
                {
                    string? url = urlElement.GetString();
                    if (!string.IsNullOrEmpty(url))
                        urls.Add(url);
                }
            }
        }

        return urls;
    }
}

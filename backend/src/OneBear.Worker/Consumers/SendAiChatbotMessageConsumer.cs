namespace OneBear.Worker.Consumers;

using System.Net.Http.Json;
using System.Text.Json;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class SendAiChatbotMessageConsumer : IConsumer<SendAiChatbotMessage>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IChatbotConfigurationRepository _chatbotRepo;
    private readonly IChatMessageRepository _messageRepo;
    private readonly IAiActivityLogger _activityLogger;
    private readonly IProductCatalogService _productCatalog;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendAiChatbotMessageConsumer> _logger;

    public SendAiChatbotMessageConsumer(
        IHttpClientFactory httpClientFactory,
        IChatbotConfigurationRepository chatbotRepo,
        IChatMessageRepository messageRepo,
        IAiActivityLogger activityLogger,
        IProductCatalogService productCatalog,
        IConfiguration configuration,
        ILogger<SendAiChatbotMessageConsumer> logger)
    {
        _httpClientFactory = httpClientFactory;
        _chatbotRepo = chatbotRepo;
        _messageRepo = messageRepo;
        _activityLogger = activityLogger;
        _productCatalog = productCatalog;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendAiChatbotMessage> context)
    {
        SendAiChatbotMessage msg = context.Message;
        CancellationToken ct = context.CancellationToken;

        _logger.LogInformation(
            "Processing AI chatbot request for room {RoomId}, message {MessageId} on {Platform}",
            msg.RoomId, msg.MessageId, msg.Platform);

        // Check AI service endpoint configuration
        string? aiServiceBaseUrl = _configuration["AiService:BaseUrl"];
        string? aiServiceApiKey = _configuration["AiService:ApiKey"];

        if (string.IsNullOrEmpty(aiServiceBaseUrl))
        {
            _logger.LogWarning(
                "AI service not configured (AiService:BaseUrl missing). Skipping AI chatbot for room {RoomId}",
                msg.RoomId);
            return;
        }

        // Load chatbot configuration for context (instructions, business overview, etc.)
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(msg.CompanyId, ct);
        if (config is null || !config.IsEnabled)
        {
            _logger.LogDebug("Chatbot disabled for company {CompanyId}, skipping", msg.CompanyId);
            return;
        }

        // Fetch last 20 messages from room for history context
        List<ChatMessage> history = await _messageRepo.GetRecentByRoomAsync(msg.RoomId, 20, ct);

        // Fetch product catalog for AI context
        var productsResult = await _productCatalog.GetActiveProductsAsync(msg.CompanyId, ct);
        var products = productsResult is Result<List<ProductCatalogItem>>.Success ps ? ps.Value : new List<ProductCatalogItem>();

        // Build the SalesBear-compatible AI service request payload
        var requestPayload = new
        {
            @event = "chatbot.message.created",
            mode = "live",
            companyId = msg.CompanyId,
            roomId = msg.RoomId,
            platform = msg.Platform,
            customer = new { id = msg.RecipientExternalId, contactId = msg.RecipientExternalId, name = (string?)null },
            message = new { role = "user", content = msg.Content, contentType = "text", timestamp = DateTimeOffset.UtcNow.ToString("o") },
            history = history.OrderBy(h => h.Timestamp).Select(h => new
            {
                role = h.IsAiMessage || h.UserId == "ai-chatbot" ? "assistant" : "user",
                content = h.Content ?? "",
                timestamp = DateTimeOffset.FromUnixTimeMilliseconds(h.Timestamp).ToString("o")
            }).ToList(),
            context = new
            {
                businessOverview = config.BusinessOverview,
                responseStyle = config.ResponseStyle,
                instructions = config.Instructions,
                tone = config.Tone,
                knowledgeSources = config.KnowledgeSources
                    .Where(ks => ks.IsActive)
                    .Select(ks => new { ks.Id, ks.Name, ks.SourceType, ks.Content })
                    .ToList(),
                upsellEnabled = config.UpsellEnabled,
                crossSellEnabled = config.CrossSellEnabled,
                upsellMaxPricePercent = config.UpsellMaxPricePercent,
                crossSellMaxItems = config.CrossSellMaxItems,
                products = products.Select(p => new
                {
                    p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.IsActive
                }).ToList()
            },
            timestamp = DateTimeOffset.UtcNow.ToString("o")
        };

        // Log AI request activity
        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = msg.CompanyId,
            RoomId = msg.RoomId,
            MessageId = msg.MessageId,
            EventType = "ai_request",
            RequestPayload = JsonSerializer.Serialize(requestPayload),
            Details = $"Forwarding message to AI service for room {msg.RoomId}"
        }, ct);

        // Forward to external AI service
        try
        {
            HttpClient client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(aiServiceBaseUrl);
            if (!string.IsNullOrEmpty(aiServiceApiKey))
                client.DefaultRequestHeaders.Add("X-Api-Key", aiServiceApiKey);

            HttpResponseMessage response = await client.PostAsJsonAsync("/v1/webhook", requestPayload, ct);

            if (!response.IsSuccessStatusCode)
            {
                string error = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning(
                    "AI service returned {StatusCode} for room {RoomId}: {Error}",
                    response.StatusCode, msg.RoomId, error);
                return;
            }

            _logger.LogInformation(
                "AI service accepted request for room {RoomId}. Response will arrive via callback.",
                msg.RoomId);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex,
                "Failed to reach AI service for room {RoomId}. Will retry via MassTransit.",
                msg.RoomId);
            throw; // Let MassTransit retry
        }
    }
}

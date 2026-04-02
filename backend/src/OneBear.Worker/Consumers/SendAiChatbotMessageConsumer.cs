namespace OneBear.Worker.Consumers;

using System.Net.Http.Json;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class SendAiChatbotMessageConsumer : IConsumer<SendAiChatbotMessage>
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IChatbotConfigurationRepository _chatbotRepo;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendAiChatbotMessageConsumer> _logger;

    public SendAiChatbotMessageConsumer(
        IHttpClientFactory httpClientFactory,
        IChatbotConfigurationRepository chatbotRepo,
        IConfiguration configuration,
        ILogger<SendAiChatbotMessageConsumer> logger)
    {
        _httpClientFactory = httpClientFactory;
        _chatbotRepo = chatbotRepo;
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

        // Build the AI service request payload
        var requestPayload = new
        {
            roomId = msg.RoomId,
            companyId = msg.CompanyId,
            messageId = msg.MessageId,
            content = msg.Content,
            platform = msg.Platform,
            recipientExternalId = msg.RecipientExternalId,
            integrationId = msg.IntegrationId,
            context = new
            {
                businessOverview = config.BusinessOverview,
                responseStyle = config.ResponseStyle,
                instructions = config.Instructions,
                knowledgeSources = config.KnowledgeSources
                    .Select(ks => new { ks.Id, ks.Name, ks.SourceType, ks.Content })
                    .ToList()
            }
        };

        // Forward to external AI service
        try
        {
            HttpClient client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(aiServiceBaseUrl);
            if (!string.IsNullOrEmpty(aiServiceApiKey))
                client.DefaultRequestHeaders.Add("X-Api-Key", aiServiceApiKey);

            HttpResponseMessage response = await client.PostAsJsonAsync("/api/v1/chat/completion", requestPayload, ct);

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

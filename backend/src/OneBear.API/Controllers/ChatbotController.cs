using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Application.Chatbot.Services;
using OneBear.Application.Common;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotConfigurationRepository _chatbotRepo;
    private readonly ChatbotService _chatbotService;
    private readonly IChatRoomRepository _roomRepo;
    private readonly IChatMessageRepository _messageRepo;
    private readonly IServiceProvider _sp;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly IAiActivityLogger _activityLogger;
    private readonly ICreditService _creditService;
    private readonly IUnansweredQuestionRepository _unansweredRepo;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ChatbotController(
        IChatbotConfigurationRepository chatbotRepo,
        ChatbotService chatbotService,
        IChatRoomRepository roomRepo,
        IChatMessageRepository messageRepo,
        IServiceProvider sp,
        ISignalRNotifier signalRNotifier,
        IAiActivityLogger activityLogger,
        ICreditService creditService,
        IUnansweredQuestionRepository unansweredRepo,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _chatbotRepo = chatbotRepo;
        _chatbotService = chatbotService;
        _roomRepo = roomRepo;
        _messageRepo = messageRepo;
        _sp = sp;
        _signalRNotifier = signalRNotifier;
        _activityLogger = activityLogger;
        _creditService = creditService;
        _unansweredRepo = unansweredRepo;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    // ──────────────────────────────────────────────
    // Chatbot Configuration (company-scoped)
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/configuration")]
    public async Task<IActionResult> GetConfiguration(string companyId, CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
        {
            return Ok(new
            {
                companyId,
                isEnabled = false,
                scheduleMode = "always",
                daySchedules = Array.Empty<object>(),
                knowledgeSources = Array.Empty<object>()
            });
        }

        return Ok(new
        {
            companyId = config.CompanyId,
            isEnabled = config.IsEnabled,
            scheduleMode = config.ScheduleMode,
            daySchedules = config.DaySchedules,
            businessOverview = config.BusinessOverview,
            responseStyle = config.ResponseStyle,
            instructions = config.Instructions,
            knowledgeSources = config.KnowledgeSources,
            updatedTimestamp = config.UpdatedTimestamp
        });
    }

    [HttpPut("api/v1/companies/{companyId}/chatbot/configuration")]
    public async Task<IActionResult> UpdateConfiguration(
        string companyId,
        [FromBody] UpdateChatbotConfigRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        ChatbotConfiguration? existing = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);

        ChatbotConfiguration config = existing ?? new ChatbotConfiguration
        {
            Id = Guid.NewGuid().ToString(),
            CompanyId = companyId
        };

        bool wasDisabled = !config.IsEnabled;

        if (request.IsEnabled.HasValue)
            config.IsEnabled = request.IsEnabled.Value;
        if (request.ScheduleMode is not null)
            config.ScheduleMode = request.ScheduleMode;
        if (request.BusinessOverview is not null)
            config.BusinessOverview = request.BusinessOverview;
        if (request.ResponseStyle is not null)
            config.ResponseStyle = request.ResponseStyle;
        if (request.Instructions is not null)
            config.Instructions = request.Instructions;
        if (request.DaySchedules is not null)
            config.DaySchedules = request.DaySchedules;

        config.UpdatedBy = userId;
        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _chatbotRepo.UpsertAsync(config, ct);

        // Seed default FAQ when chatbot is first enabled
        if (wasDisabled && config.IsEnabled)
        {
            await _chatbotService.SeedDefaultKnowledgeBaseAsync(config, ct);
        }

        return Ok(new
        {
            companyId = config.CompanyId,
            isEnabled = config.IsEnabled,
            scheduleMode = config.ScheduleMode,
            daySchedules = config.DaySchedules,
            businessOverview = config.BusinessOverview,
            responseStyle = config.ResponseStyle,
            instructions = config.Instructions,
            knowledgeSources = config.KnowledgeSources,
            updatedTimestamp = config.UpdatedTimestamp
        });
    }

    [HttpPatch("api/v1/companies/{companyId}/chatbot/configuration/instructions")]
    public async Task<IActionResult> PatchInstructions(
        string companyId,
        [FromBody] PatchInstructionsRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound();

        config.Instructions = request.Instructions;
        config.UpdatedBy = userId;
        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _chatbotRepo.UpsertAsync(config, ct);
        return Ok(new { companyId, instructions = config.Instructions, updatedTimestamp = config.UpdatedTimestamp });
    }

    // ──────────────────────────────────────────────
    // Knowledge Sources
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/knowledge-sources")]
    public async Task<IActionResult> ListKnowledgeSources(string companyId, CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        return Ok(new { data = config?.KnowledgeSources ?? new List<KnowledgeSource>() });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/knowledge-sources")]
    public async Task<IActionResult> AddKnowledgeSource(
        string companyId,
        [FromBody] KnowledgeSource source,
        CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found. Create it first." });

        config.KnowledgeSources.Add(source);
        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _chatbotRepo.UpsertAsync(config, ct);

        return StatusCode(201, source);
    }

    [HttpDelete("api/v1/companies/{companyId}/chatbot/knowledge-sources/{sourceId}")]
    public async Task<IActionResult> DeleteKnowledgeSource(string companyId, string sourceId, CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null) return NotFound();

        config.KnowledgeSources.RemoveAll(s => s.Id == sourceId);
        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _chatbotRepo.UpsertAsync(config, ct);

        return NoContent();
    }

    // ──────────────────────────────────────────────
    // FAQ CRUD
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/faq")]
    public async Task<IActionResult> ListFaq(string companyId, CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        return Ok(new { data = config?.FaqEntries ?? new List<FaqEntry>() });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/faq")]
    public async Task<IActionResult> AddFaq(
        string companyId,
        [FromBody] AddFaqRequest request,
        CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found. Create it first." });

        FaqEntry entry = new()
        {
            Question = request.Question,
            Answer = request.Answer,
            IsDefault = false,
            CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        config.FaqEntries.Add(entry);
        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _chatbotRepo.UpsertAsync(config, ct);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId,
            EventType = "kb_change",
            Details = $"Added FAQ: {request.Question}"
        }, ct);

        return StatusCode(201, entry);
    }

    [HttpPut("api/v1/companies/{companyId}/chatbot/faq/{faqId}")]
    public async Task<IActionResult> UpdateFaq(
        string companyId,
        string faqId,
        [FromBody] AddFaqRequest request,
        CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found." });

        FaqEntry? existing = config.FaqEntries.FirstOrDefault(f => f.Id == faqId);
        if (existing is null)
            return NotFound(new { error = "FAQ entry not found." });

        existing.Question = request.Question;
        existing.Answer = request.Answer;
        existing.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _chatbotRepo.UpsertAsync(config, ct);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId,
            EventType = "kb_change",
            Details = $"Updated FAQ {faqId}: {request.Question}"
        }, ct);

        return Ok(existing);
    }

    [HttpDelete("api/v1/companies/{companyId}/chatbot/faq/{faqId}")]
    public async Task<IActionResult> DeleteFaq(
        string companyId,
        string faqId,
        CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound();

        int removed = config.FaqEntries.RemoveAll(f => f.Id == faqId);
        if (removed == 0)
            return NotFound(new { error = "FAQ entry not found." });

        config.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _chatbotRepo.UpsertAsync(config, ct);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId,
            EventType = "kb_change",
            Details = $"Deleted FAQ {faqId}"
        }, ct);

        return NoContent();
    }

    // ──────────────────────────────────────────────
    // FAQ CSV Import
    // ──────────────────────────────────────────────

    [HttpPost("api/v1/companies/{companyId}/chatbot/faq/import-csv")]
    public async Task<IActionResult> ImportFaqCsv(
        string companyId,
        IFormFile file,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "CSV file is required." });

        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found. Create it first." });

        List<string> errors = new();
        int imported = 0;
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        using StreamReader reader = new(file.OpenReadStream());
        string? headerLine = await reader.ReadLineAsync(ct);
        if (headerLine is null)
        {
            return BadRequest(new { error = "CSV file is empty." });
        }

        int lineNumber = 1;
        while (!reader.EndOfStream)
        {
            lineNumber++;
            string? line = await reader.ReadLineAsync(ct);
            if (string.IsNullOrWhiteSpace(line))
                continue;

            // Simple CSV parsing: split by comma (supports quoted values)
            string[] parts = ParseCsvLine(line);
            if (parts.Length < 2)
            {
                errors.Add($"Line {lineNumber}: Expected at least 2 columns (Question, Answer).");
                continue;
            }

            string question = parts[0].Trim();
            string answer = parts[1].Trim();

            if (string.IsNullOrWhiteSpace(question) || string.IsNullOrWhiteSpace(answer))
            {
                errors.Add($"Line {lineNumber}: Question and Answer must not be empty.");
                continue;
            }

            config.FaqEntries.Add(new FaqEntry
            {
                Question = question,
                Answer = answer,
                IsDefault = false,
                CreatedTimestamp = now
            });
            imported++;
        }

        if (imported > 0)
        {
            config.UpdatedTimestamp = now;
            await _chatbotRepo.UpsertAsync(config, ct);

            await _activityLogger.LogAsync(new AiActivityLog
            {
                CompanyId = companyId,
                EventType = "kb_change",
                Details = $"CSV import: {imported} entries imported, {errors.Count} errors"
            }, ct);
        }

        return Ok(new { imported, errors });
    }

    // ──────────────────────────────────────────────
    // Test Mode
    // ──────────────────────────────────────────────

    [HttpPost("api/v1/companies/{companyId}/chatbot/test")]
    public async Task<IActionResult> TestChatbot(
        string companyId,
        [FromBody] TestChatbotRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { error = "message is required." });

        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found." });

        string? aiServiceUrl = _configuration["AiService:BaseUrl"];
        if (string.IsNullOrEmpty(aiServiceUrl))
            return StatusCode(503, new { error = "AI service URL not configured." });

        // Build a test payload compatible with the AI service
        object payload = new
        {
            companyId,
            roomId = "test-room",
            messageId = Guid.NewGuid().ToString(),
            content = request.Message,
            mode = "test",
            businessOverview = config.BusinessOverview,
            responseStyle = config.ResponseStyle,
            instructions = config.Instructions,
            tone = config.Tone,
            faqEntries = config.FaqEntries.Select(f => new { f.Question, f.Answer })
        };

        HttpClient client = _httpClientFactory.CreateClient();
        string payloadJson = JsonSerializer.Serialize(payload);

        try
        {
            HttpResponseMessage response = await client.PostAsync(
                $"{aiServiceUrl.TrimEnd('/')}/api/v1/chat",
                new StringContent(payloadJson, System.Text.Encoding.UTF8, "application/json"),
                ct);

            string responseBody = await response.Content.ReadAsStringAsync(ct);

            await _activityLogger.LogAsync(new AiActivityLog
            {
                CompanyId = companyId,
                EventType = "test",
                RequestPayload = payloadJson,
                ResponsePayload = responseBody,
                Details = $"Test mode: {request.Message}"
            }, ct);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { error = "AI service error", details = responseBody });
            }

            return Ok(JsonSerializer.Deserialize<JsonElement>(responseBody));
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { error = "Failed to reach AI service.", details = ex.Message });
        }
    }

    // ──────────────────────────────────────────────
    // Insights (Unanswered Questions)
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/insights/unanswered")]
    public async Task<IActionResult> ListUnanswered(
        string companyId,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        List<UnansweredQuestion> items = await _unansweredRepo.GetByCompanyAsync(companyId, limit, ct);
        return Ok(new { data = items });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/insights/{id}/add-to-faq")]
    public async Task<IActionResult> AddInsightToFaq(
        string companyId,
        string id,
        [FromBody] AddInsightToFaqRequest request,
        CancellationToken ct)
    {
        UnansweredQuestion? insight = await _unansweredRepo.GetByIdAsync(id, ct);
        if (insight is null || insight.CompanyId != companyId)
            return NotFound(new { error = "Insight not found." });

        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null)
            return NotFound(new { error = "Chatbot configuration not found." });

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        FaqEntry entry = new()
        {
            Question = insight.Question,
            Answer = request.Answer,
            IsDefault = false,
            CreatedTimestamp = now
        };

        config.FaqEntries.Add(entry);
        config.UpdatedTimestamp = now;
        await _chatbotRepo.UpsertAsync(config, ct);

        await _unansweredRepo.DeleteAsync(id, ct);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId,
            EventType = "kb_change",
            Details = $"Added FAQ from insight: {insight.Question}"
        }, ct);

        return Ok(entry);
    }

    [HttpDelete("api/v1/companies/{companyId}/chatbot/insights/{id}")]
    public async Task<IActionResult> DismissInsight(
        string companyId,
        string id,
        CancellationToken ct)
    {
        UnansweredQuestion? insight = await _unansweredRepo.GetByIdAsync(id, ct);
        if (insight is null || insight.CompanyId != companyId)
            return NotFound(new { error = "Insight not found." });

        await _unansweredRepo.DeleteAsync(id, ct);
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Credit API
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/credit")]
    public async Task<IActionResult> GetCreditStatus(string companyId, CancellationToken ct)
    {
        CreditStatusDto status = await _creditService.GetStatusAsync(companyId, ct);
        return Ok(new
        {
            creditLimit = status.CreditLimit,
            creditUsed = status.CreditUsed,
            creditRemaining = status.CreditRemaining,
            planId = status.PlanId,
            warning = status.Warning.ToString()
        });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/credit/topup")]
    public async Task<IActionResult> TopUpCredit(
        string companyId,
        [FromBody] TopUpCreditRequest request,
        CancellationToken ct)
    {
        if (request.Amount <= 0)
            return BadRequest(new { error = "Amount must be greater than 0." });

        CreditStatusDto status = await _creditService.TopUpAsync(
            companyId, request.Amount, request.Reason ?? "manual_topup", ct);

        return Ok(new
        {
            creditLimit = status.CreditLimit,
            creditUsed = status.CreditUsed,
            creditRemaining = status.CreditRemaining,
            planId = status.PlanId,
            warning = status.Warning.ToString()
        });
    }

    // ──────────────────────────────────────────────
    // Internal / API-key endpoints
    // ──────────────────────────────────────────────

    /// <summary>
    /// Called by the AI service when it cannot handle the conversation (e.g. confidence below threshold).
    /// Mutes AI for the room and sets handoff metadata so an admin can take over.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("api/v1/chatbot/callback/handoff")]
    public async Task<IActionResult> ChatbotCallbackHandoff(
        [FromBody] AiHandoffCallbackRequest request, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(request.RoomId) || string.IsNullOrEmpty(request.CompanyId))
            return BadRequest(new { error = "roomId and companyId are required" });

        ChatRoom? room = await _roomRepo.GetByIdAsync(request.RoomId, request.CompanyId, ct);
        if (room is null)
            return NotFound(new { error = "Room not found" });

        Result<ChatRoom> result = await _chatbotService.HandleHandoffAsync(
            room, request.Reason, request.Confidence, ct);
        if (result is Result<ChatRoom>.Failure f)
            return StatusCode(500, new { error = f.Error.Message });

        ChatRoom updated = ((Result<ChatRoom>.Success)result).Value;

        // Notify admins via SignalR that the room needs attention
        await _signalRNotifier.SendToCompanyAsync(updated.CompanyId, "RoomUpdated", new
        {
            roomId = updated.Id,
            changes = new
            {
                isAiMuted = updated.IsAiMuted,
                handoffSource = updated.HandoffSource,
                handoffSourceName = updated.HandoffSourceName,
                handoffTimestamp = updated.HandoffTimestamp
            }
        }, ct);

        return Ok(new { status = "handed_off", roomId = updated.Id, handoffTimestamp = updated.HandoffTimestamp });
    }

    [AllowAnonymous]
    [HttpPost("api/v1/chatbot/callback/message")]
    public async Task<IActionResult> ChatbotCallbackMessage(
        [FromBody] AiCallbackRequest request, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(request.RoomId) || string.IsNullOrEmpty(request.CompanyId))
            return BadRequest(new { error = "roomId and companyId are required" });

        // Validate the AI response
        Result<string> validationResult = await _chatbotService.ProcessAiCallbackAsync(
            request.CompanyId, request.RoomId, request.ResponseContent, ct);
        if (validationResult is Result<string>.Failure failure)
            return BadRequest(new { error = failure.Error.Message });

        string responseContent = ((Result<string>.Success)validationResult).Value;

        // Get room to find the platform and recipient
        ChatRoom? room = await _roomRepo.GetByIdAsync(request.RoomId, request.CompanyId, ct);
        if (room is null)
            return NotFound(new { error = "Room not found" });

        string? recipientExternalId = room.Customer?.ExternalId;
        if (string.IsNullOrEmpty(recipientExternalId))
            return BadRequest(new { error = "Room has no customer external ID" });

        // Send via platform adapter
        IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(room.Platform);
        IntegrationChannel? integration = null;
        Application.Common.Interfaces.IIntegrationService integrationService =
            _sp.GetRequiredService<Application.Common.Interfaces.IIntegrationService>();
        Result<IntegrationChannel> intResult = await integrationService.ValidateAndGetAsync(
            room.IntegrationId, room.CompanyId, ct);
        if (intResult is Result<IntegrationChannel>.Success intSuccess)
            integration = intSuccess.Value;

        if (integration is null)
            return BadRequest(new { error = "Integration not found or inactive" });

        Result<PlatformSendResult> sendResult =
            await adapter.SendTextAsync(recipientExternalId, responseContent, integration, ct);

        // Persist the AI response as a system message
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        ChatMessage aiMessage = new()
        {
            Id = Guid.NewGuid().ToString(),
            RoomId = room.Id,
            UserId = "ai-chatbot",
            Content = responseContent,
            Type = MessageType.Text,
            Platform = room.Platform,
            Timestamp = now,
            CompanyId = room.CompanyId,
            IsAiMessage = true,
            CreatedBy = "ai",
            DeliveryStatus = sendResult is Result<PlatformSendResult>.Success s && s.Value.Success
                ? MessageDeliveryState.Sent
                : MessageDeliveryState.Failed,
            CreatedTimestamp = now
        };
        await _messageRepo.CreateAsync(aiMessage, ct);

        // Deduct 1 AI credit
        await _creditService.DeductAsync(request.CompanyId, 1, "ai_response", request.RoomId, ct);

        // Log AI response activity
        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = request.CompanyId,
            RoomId = request.RoomId,
            MessageId = aiMessage.Id,
            EventType = "ai_response",
            Model = request.Usage?.Model,
            PromptTokens = request.Usage?.PromptTokens,
            CompletionTokens = request.Usage?.CompletionTokens,
            Details = $"AI responded with {responseContent.Length} chars. Tokens: {request.Usage?.TotalTokens ?? 0}"
        }, ct);

        // Notify via SignalR
        await _signalRNotifier.SendToRoomAsync(room.Id, "ReceiveMessage", new
        {
            id = aiMessage.Id,
            roomId = aiMessage.RoomId,
            userId = aiMessage.UserId,
            content = aiMessage.Content,
            type = aiMessage.Type,
            platform = aiMessage.Platform,
            timestamp = aiMessage.Timestamp,
            deliveryStatus = aiMessage.DeliveryStatus,
            isAiMessage = aiMessage.IsAiMessage
        }, ct);

        return Ok(new
        {
            status = "delivered",
            messageId = aiMessage.Id,
            deliveryStatus = aiMessage.DeliveryStatus,
            timestamp = now
        });
    }

    // ── Helpers ──────────────────────────────────────────

    /// <summary>
    /// Simple CSV line parser that handles quoted values containing commas.
    /// </summary>
    private static string[] ParseCsvLine(string line)
    {
        List<string> fields = new();
        bool inQuotes = false;
        int fieldStart = 0;

        for (int i = 0; i < line.Length; i++)
        {
            if (line[i] == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (line[i] == ',' && !inQuotes)
            {
                fields.Add(UnquoteCsvField(line[fieldStart..i]));
                fieldStart = i + 1;
            }
        }

        fields.Add(UnquoteCsvField(line[fieldStart..]));
        return fields.ToArray();
    }

    private static string UnquoteCsvField(string field)
    {
        string trimmed = field.Trim();
        if (trimmed.Length >= 2 && trimmed[0] == '"' && trimmed[^1] == '"')
        {
            return trimmed[1..^1].Replace("\"\"", "\"");
        }
        return trimmed;
    }
}

public record UpdateChatbotConfigRequest
{
    public bool? IsEnabled { get; init; }
    public string? ScheduleMode { get; init; }
    public string? BusinessOverview { get; init; }
    public string? ResponseStyle { get; init; }
    public string? Instructions { get; init; }
    public List<DaySchedule>? DaySchedules { get; init; }
}

public record PatchInstructionsRequest
{
    public string Instructions { get; init; } = default!;
}

public record AiCallbackRequest
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string ResponseContent { get; init; } = default!;
    public string? MessageId { get; init; }
    public AiUsageInfo? Usage { get; init; }
    public List<string>? AutoTagIds { get; init; }
    public bool IsAiMuted { get; init; }
}

public record AiUsageInfo(
    string? Model,
    int? PromptTokens,
    int? CompletionTokens,
    int? TotalTokens,
    List<string>? SourceIds);

public record AiHandoffCallbackRequest
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string? Reason { get; init; }
    public double? Confidence { get; init; }
}

public record AddFaqRequest(string Question, string Answer);

public record TestChatbotRequest
{
    public string Message { get; init; } = default!;
}

public record AddInsightToFaqRequest
{
    public string Answer { get; init; } = default!;
}

public record TopUpCreditRequest
{
    public int Amount { get; init; }
    public string? Reason { get; init; }
}

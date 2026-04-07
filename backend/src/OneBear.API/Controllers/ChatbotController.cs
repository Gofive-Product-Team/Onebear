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

    public ChatbotController(
        IChatbotConfigurationRepository chatbotRepo,
        ChatbotService chatbotService,
        IChatRoomRepository roomRepo,
        IChatMessageRepository messageRepo,
        IServiceProvider sp,
        ISignalRNotifier signalRNotifier)
    {
        _chatbotRepo = chatbotRepo;
        _chatbotService = chatbotService;
        _roomRepo = roomRepo;
        _messageRepo = messageRepo;
        _sp = sp;
        _signalRNotifier = signalRNotifier;
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

        Result<ChatRoom> result = await _chatbotService.HandleHandoffAsync(room, ct);
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
            DeliveryStatus = sendResult is Result<PlatformSendResult>.Success s && s.Value.Success
                ? MessageDeliveryState.Sent
                : MessageDeliveryState.Failed,
            CreatedTimestamp = now
        };
        await _messageRepo.CreateAsync(aiMessage, ct);

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
            deliveryStatus = aiMessage.DeliveryStatus
        }, ct);

        return Ok(new
        {
            status = "delivered",
            messageId = aiMessage.Id,
            deliveryStatus = aiMessage.DeliveryStatus,
            timestamp = now
        });
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
}

public record AiHandoffCallbackRequest
{
    public string RoomId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string? Reason { get; init; }
    public double? Confidence { get; init; }
}

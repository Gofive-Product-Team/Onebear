using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotConfigurationRepository _chatbotRepo;

    public ChatbotController(IChatbotConfigurationRepository chatbotRepo)
    {
        _chatbotRepo = chatbotRepo;
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

    [AllowAnonymous]
    [HttpPost("api/v1/chatbot/callback/message")]
    public IActionResult ChatbotCallbackMessage()
    {
        // AI service callback endpoint — to be implemented when AI service is configured
        return Ok(new { status = "received", timestamp = DateTimeOffset.UtcNow });
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

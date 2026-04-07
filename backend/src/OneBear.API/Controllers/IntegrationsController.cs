using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Application.Common.DTOs;
using OneBear.Application.Integrations.Mappings;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/integrations")]
[Authorize]
[EnableRateLimiting("api")]
public class IntegrationsController : ControllerBase
{
    private readonly IIntegrationChannelRepository _integrationRepo;

    public IntegrationsController(IIntegrationChannelRepository integrationRepo)
    {
        _integrationRepo = integrationRepo;
    }

    // ──────────────────────────────────────────────
    // Core CRUD
    // ──────────────────────────────────────────────

    /// <summary>List all integrations for a company.</summary>
    [HttpGet]
    public async Task<IActionResult> ListIntegrations(string companyId, CancellationToken ct)
    {
        List<IntegrationChannel> integrations = await _integrationRepo.GetByCompanyIdAsync(companyId, ct);
        List<IntegrationChannelDto> dtos = integrations.Select(IntegrationMapper.ToDto).ToList();
        return Ok(new { data = dtos });
    }

    /// <summary>Connect a platform integration.</summary>
    [HttpPost("{platform}")]
    public async Task<IActionResult> ConnectPlatform(
        string companyId, string platform,
        [FromBody] ConnectPlatformRequest request,
        CancellationToken ct)
    {
        string userId = User.GetUserId();
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string id = Guid.NewGuid().ToString();
        string webhookUrl = $"/api/v1/webhooks/{platform.ToLower()}/{companyId}/{id}";

        IntegrationChannel channel = new()
        {
            Id = id,
            CompanyId = companyId,
            Platform = platform.ToLowerInvariant(),
            Name = request.Name,
            IsActive = true,
            HasChatFeature = true,
            WebhookUrl = webhookUrl,
            Credentials = new PlatformCredentials
            {
                ChannelId = request.ChannelId,
                ChannelSecret = request.ChannelSecret,
                AccessToken = request.ChannelAccessToken ?? request.AccessToken,
                RefreshToken = request.RefreshToken,
                AppSecret = request.AppSecret,
                PhoneNumberId = request.PhoneNumberId,
                BusinessAccountId = request.BusinessAccountId,
                EmailAddress = request.EmailAddress,
                EmailPassword = request.EmailPassword,
                SmtpHost = request.SmtpHost,
                SmtpPort = request.SmtpPort,
                ImapHost = request.ImapHost,
                ImapPort = request.ImapPort,
            },
            CreatedBy = userId,
            CreatedTimestamp = now
        };

        IntegrationChannel created = await _integrationRepo.CreateAsync(channel, ct);
        return StatusCode(201, IntegrationMapper.ToDto(created));
    }

    /// <summary>Disconnect (delete) an integration.</summary>
    [HttpDelete("{integrationId}")]
    public async Task<IActionResult> DeleteIntegration(string companyId, string integrationId, CancellationToken ct)
    {
        await _integrationRepo.DeleteAsync(integrationId, companyId, ct);
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Greeting Messages
    // ──────────────────────────────────────────────

    [HttpGet("{integrationId}/greeting-messages")]
    public async Task<IActionResult> GetGreetingMessages(string companyId, string integrationId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();
        return Ok(new { data = integration.GreetingMessages });
    }

    [HttpPut("{integrationId}/greeting-messages")]
    public async Task<IActionResult> UpdateGreetingMessages(
        string companyId, string integrationId,
        [FromBody] UpdateGreetingMessagesRequest request,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        integration.GreetingMessages = request.Messages;
        integration.UpdatedBy = User.GetUserId();
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return Ok(new { data = integration.GreetingMessages });
    }

    // ──────────────────────────────────────────────
    // Auto-Replies
    // ──────────────────────────────────────────────

    [HttpGet("{integrationId}/auto-replies")]
    public async Task<IActionResult> GetAutoReplies(string companyId, string integrationId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();
        return Ok(new { data = integration.AutoReplies });
    }

    [HttpPut("{integrationId}/auto-replies")]
    public async Task<IActionResult> UpdateAutoReplies(
        string companyId, string integrationId,
        [FromBody] UpdateAutoRepliesRequest request,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        integration.AutoReplies = request.Rules;
        integration.UpdatedBy = User.GetUserId();
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return Ok(new { data = integration.AutoReplies });
    }

    // ──────────────────────────────────────────────
    // Auto-Assignment
    // ──────────────────────────────────────────────

    [HttpGet("{integrationId}/auto-assignment")]
    public async Task<IActionResult> GetAutoAssignment(string companyId, string integrationId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();
        return Ok(integration.AutoAssignment ?? new AutoAssignmentSettings());
    }

    [HttpPut("{integrationId}/auto-assignment")]
    public async Task<IActionResult> UpdateAutoAssignment(
        string companyId, string integrationId,
        [FromBody] AutoAssignmentSettings settings,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        integration.AutoAssignment = settings;
        integration.UpdatedBy = User.GetUserId();
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return Ok(integration.AutoAssignment);
    }

    // ──────────────────────────────────────────────
    // Shortcuts (Quick Replies)
    // ──────────────────────────────────────────────

    [HttpGet("{integrationId}/shortcuts")]
    public async Task<IActionResult> ListShortcuts(string companyId, string integrationId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();
        return Ok(new { data = integration.Shortcuts, categories = integration.ShortcutCategories });
    }

    [HttpPost("{integrationId}/shortcuts")]
    public async Task<IActionResult> CreateShortcut(
        string companyId, string integrationId,
        [FromBody] Shortcut shortcut,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        shortcut.Id = Guid.NewGuid().ToString();
        integration.Shortcuts.Add(shortcut);
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return StatusCode(201, shortcut);
    }

    [HttpPut("{integrationId}/shortcuts/{shortcutId}")]
    public async Task<IActionResult> UpdateShortcut(
        string companyId, string integrationId, string shortcutId,
        [FromBody] Shortcut updated,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        int idx = integration.Shortcuts.FindIndex(s => s.Id == shortcutId);
        if (idx < 0) return NotFound();

        updated.Id = shortcutId;
        integration.Shortcuts[idx] = updated;
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return Ok(updated);
    }

    [HttpDelete("{integrationId}/shortcuts/{shortcutId}")]
    public async Task<IActionResult> DeleteShortcut(
        string companyId, string integrationId, string shortcutId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        integration.Shortcuts.RemoveAll(s => s.Id == shortcutId);
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Shortcut Categories
    // ──────────────────────────────────────────────

    [HttpGet("{integrationId}/shortcut-categories")]
    public async Task<IActionResult> ListShortcutCategories(
        string companyId, string integrationId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();
        return Ok(new { data = integration.ShortcutCategories });
    }

    [HttpPost("{integrationId}/shortcut-categories")]
    public async Task<IActionResult> CreateShortcutCategory(
        string companyId, string integrationId,
        [FromBody] ShortcutCategory category,
        CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        category.Id = Guid.NewGuid().ToString();
        integration.ShortcutCategories.Add(category);
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return StatusCode(201, category);
    }

    [HttpDelete("{integrationId}/shortcut-categories/{categoryId}")]
    public async Task<IActionResult> DeleteShortcutCategory(
        string companyId, string integrationId, string categoryId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null) return NotFound();

        integration.ShortcutCategories.RemoveAll(c => c.Id == categoryId);
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);
        return NoContent();
    }
}

// Request DTOs
public record ConnectPlatformRequest
{
    public string? Name { get; init; }
    public string? ChannelId { get; init; }
    public string? ChannelSecret { get; init; }
    public string? ChannelAccessToken { get; init; }
    public string? RefreshToken { get; init; }
    public string? PageAccessToken { get; init; }
    public string? AppSecret { get; init; }
    public string? PhoneNumberId { get; init; }
    public string? BusinessAccountId { get; init; }
    public string? AccessToken { get; init; }
    public string? EmailAddress { get; init; }
    public string? EmailPassword { get; init; }
    public string? SmtpHost { get; init; }
    public int? SmtpPort { get; init; }
    public string? ImapHost { get; init; }
    public int? ImapPort { get; init; }
}

public record UpdateGreetingMessagesRequest
{
    public List<GreetingMessage> Messages { get; init; } = new();
}

public record UpdateAutoRepliesRequest
{
    public List<AutoReply> Rules { get; init; } = new();
}

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.ValueObjects;

namespace OneBear.API.Controllers;

[ApiController]
[EnableRateLimiting("webhook")]
public class WebhooksController : ControllerBase
{
    private readonly MessageOrchestrator _orchestrator;
    private readonly IIntegrationService _integrationService;
    private readonly IServiceProvider _sp;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        MessageOrchestrator orchestrator,
        IIntegrationService integrationService,
        IServiceProvider sp,
        ILogger<WebhooksController> logger)
    {
        _orchestrator = orchestrator;
        _integrationService = integrationService;
        _sp = sp;
        _logger = logger;
    }

    // ──────────────────────────────────────────────
    // Generic platform webhook handler
    // ──────────────────────────────────────────────

    private async Task<IActionResult> HandlePlatformWebhookAsync(
        string platform, string companyId, string integrationId, CancellationToken ct)
    {
        Request.EnableBuffering();
        byte[] body;
        using (MemoryStream ms = new())
        {
            await Request.Body.CopyToAsync(ms, ct);
            body = ms.ToArray();
        }
        Request.Body.Position = 0;

        IntegrationChannel? integration = await _integrationService.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null || !integration.IsActive)
            return Ok(); // Return 200 to prevent platform retries

        // Dev bypass: skip signature validation with X-Webhook-Dev-Bypass header
        bool isDev = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment();
        bool devBypass = isDev && Request.Headers.ContainsKey("X-Webhook-Dev-Bypass");

        if (!devBypass)
        {
            IDictionary<string, string> headers = Request.Headers
                .ToDictionary(h => h.Key, h => h.Value.ToString(), StringComparer.OrdinalIgnoreCase);

            IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(platform);
            Result<WebhookValidationResult> signatureResult =
                await adapter.ValidateWebhookSignatureAsync(body, headers, integration, ct);

            if (signatureResult is not Result<WebhookValidationResult>.Success)
            {
                _logger.LogWarning("{Platform} webhook signature validation failed for integration {IntegrationId}",
                    platform, integrationId);
                return Unauthorized();
            }
        }
        else
        {
            _logger.LogInformation("[DEV] Signature validation bypassed for {Platform} webhook", platform);
        }

        using JsonDocument doc = await JsonDocument.ParseAsync(new MemoryStream(body), cancellationToken: ct);
        Result<InboundMessageResult> result =
            await _orchestrator.ProcessInboundAsync(platform, integrationId, companyId, doc, ct);

        if (result is Result<InboundMessageResult>.Failure failure)
            _logger.LogWarning("{Platform} inbound processing failed: {Error}", platform, failure.Error.Message);

        return Ok();
    }

    // ──────────────────────────────────────────────
    // Platform webhooks (anonymous)
    // ──────────────────────────────────────────────

    // Fixed LINE webhook URL (no companyId/integrationId in path)
    // LINE sends `destination` (bot_id) in payload — use it to lookup the integration
    [HttpPost("api/v1/webhooks/line")]
    public async Task<IActionResult> LineWebhookFixed(CancellationToken ct)
    {
        Request.EnableBuffering();
        byte[] body;
        using (MemoryStream ms = new())
        {
            await Request.Body.CopyToAsync(ms, ct);
            body = ms.ToArray();
        }
        Request.Body.Position = 0;

        // Parse destination (bot_id) from LINE webhook payload
        try
        {
            JsonDocument payload = await JsonDocument.ParseAsync(Request.Body, cancellationToken: ct);
            string? destination = payload.RootElement.TryGetProperty("destination", out JsonElement destEl)
                ? destEl.GetString() : null;

            if (string.IsNullOrEmpty(destination))
            {
                _logger.LogWarning("LINE webhook missing 'destination' field");
                return Ok();
            }

            // Lookup integration by bot_id (stored in PlatformAccountId field)
            IntegrationChannel? integration = await _integrationService.GetByBotIdAsync(
                SocialPlatform.Line, destination, ct);

            if (integration is null || !integration.IsActive)
            {
                _logger.LogWarning("No active LINE integration found for destination {Destination}", destination);
                return Ok();
            }

            // Dev bypass header or Development environment
            bool devBypass = Request.Headers.ContainsKey("X-Webhook-Dev-Bypass");
            if (!devBypass)
            {
                IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(integration.Platform);
                IDictionary<string, string> headers = Request.Headers.ToDictionary(
                    h => h.Key, h => h.Value.ToString(), StringComparer.OrdinalIgnoreCase);
                Result<WebhookValidationResult> validation = await adapter.ValidateWebhookSignatureAsync(
                    body, headers, integration, ct);
                if (validation is Result<WebhookValidationResult>.Failure vf)
                {
                    _logger.LogWarning("LINE webhook signature validation failed: {Error}", vf.Error.Message);
                    return Ok();
                }
                if (validation is Result<WebhookValidationResult>.Success vs && !vs.Value.IsValid)
                {
                    _logger.LogWarning("LINE webhook signature invalid");
                    return Ok();
                }
            }

            Request.Body.Position = 0;
            JsonDocument doc = await JsonDocument.ParseAsync(Request.Body, cancellationToken: ct);
            _logger.LogInformation("LINE webhook: calling ProcessInboundAsync for integration {IntId}, company {CompanyId}",
                integration.Id, integration.CompanyId);
            Result<InboundMessageResult> result = await _orchestrator.ProcessInboundAsync(
                integration.Platform, integration.Id, integration.CompanyId, doc, ct);
            if (result is Result<InboundMessageResult>.Failure fail)
                _logger.LogWarning("LINE webhook processing failed: {Error} - {Detail}", fail.Error.Code, fail.Error.Message);
            else
                _logger.LogInformation("LINE webhook processed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing LINE webhook");
        }

        return Ok();
    }

    // Legacy LINE webhook with companyId/integrationId (keep for backward compat)
    [HttpPost("api/v1/webhooks/line/{companyId}/{integrationId}")]
    public Task<IActionResult> LineWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Line, companyId, integrationId, ct);

    [HttpPost("api/v1/webhooks/facebook/{companyId}/{integrationId}")]
    public Task<IActionResult> FacebookWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Facebook, companyId, integrationId, ct);

    [HttpGet("api/v1/webhooks/facebook/{companyId}/{integrationId}")]
    public IActionResult FacebookVerify([FromQuery(Name = "hub.challenge")] string challenge)
        => Ok(challenge);

    [HttpPost("api/v1/webhooks/instagram/{companyId}/{integrationId}")]
    public Task<IActionResult> InstagramWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Instagram, companyId, integrationId, ct);

    [HttpGet("api/v1/webhooks/instagram/{companyId}/{integrationId}")]
    public IActionResult InstagramVerify([FromQuery(Name = "hub.challenge")] string challenge)
        => Ok(challenge);

    [HttpPost("api/v1/webhooks/whatsapp/{companyId}/{integrationId}")]
    public Task<IActionResult> WhatsAppWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.WhatsApp, companyId, integrationId, ct);

    [HttpGet("api/v1/webhooks/whatsapp/{companyId}/{integrationId}")]
    public IActionResult WhatsAppVerify([FromQuery(Name = "hub.challenge")] string challenge)
        => Ok(challenge);

    [HttpPost("api/v1/webhooks/email/{companyId}/{integrationId}")]
    public Task<IActionResult> EmailWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Email, companyId, integrationId, ct);

    [HttpPost("api/v1/webhooks/tiktok/{companyId}/{integrationId}")]
    public Task<IActionResult> TikTokWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.TikTok, companyId, integrationId, ct);

    [HttpPost("api/v1/webhooks/lazada/{companyId}/{integrationId}")]
    public Task<IActionResult> LazadaWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Lazada, companyId, integrationId, ct);

    [HttpPost("api/v1/webhooks/shopee/{companyId}/{integrationId}")]
    public Task<IActionResult> ShopeeWebhook(string companyId, string integrationId, CancellationToken ct)
        => HandlePlatformWebhookAsync(SocialPlatform.Shopee, companyId, integrationId, ct);

    // ──────────────────────────────────────────────
    // Internal webhooks (API key)
    // ──────────────────────────────────────────────

    [HttpPost("api/v1/webhooks/internal/messages")]
    public IActionResult InternalMessages()
        => StatusCode(201, new { messageId = Guid.NewGuid(), timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });

    [HttpPost("api/v1/webhooks/internal/email")]
    public IActionResult InternalEmail()
        => StatusCode(201, new { status = "received" });

    [HttpPost("api/v1/webhooks/internal/message-on-behalf")]
    public IActionResult MessageOnBehalf()
        => StatusCode(201, new { status = "received" });

    [HttpPost("api/v1/webhooks/internal/line-multicast")]
    public IActionResult LineMulticast()
        => StatusCode(201, new { status = "received" });

    [HttpPost("api/v1/webhooks/internal/facebook-comment-reply")]
    public IActionResult FacebookCommentReply()
        => StatusCode(201, new { status = "received" });
}

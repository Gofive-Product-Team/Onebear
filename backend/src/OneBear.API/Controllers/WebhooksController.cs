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
    // Platform webhooks (anonymous)
    // ──────────────────────────────────────────────

    [HttpPost("api/v1/webhooks/line/{companyId}/{integrationId}")]
    public async Task<IActionResult> LineWebhook(string companyId, string integrationId, CancellationToken ct)
    {
        // Read raw body for signature validation
        Request.EnableBuffering();
        byte[] body;
        using (MemoryStream ms = new())
        {
            await Request.Body.CopyToAsync(ms, ct);
            body = ms.ToArray();
        }
        Request.Body.Position = 0;

        // Look up integration by companyId partition key
        IntegrationChannel? integration = await _integrationService.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null || !integration.IsActive)
            return Ok(); // Return 200 to prevent platform retries

        // Validate LINE webhook signature
        IDictionary<string, string> headers = Request.Headers
            .ToDictionary(h => h.Key, h => h.Value.ToString());

        IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(SocialPlatform.Line);
        Result<WebhookValidationResult> signatureResult =
            await adapter.ValidateWebhookSignatureAsync(body, headers, integration, ct);

        if (signatureResult is not Result<WebhookValidationResult>.Success)
        {
            _logger.LogWarning("LINE webhook signature validation failed for integration {IntegrationId}", integrationId);
            return Unauthorized();
        }

        // Parse body and process through the orchestrator
        using JsonDocument doc = await JsonDocument.ParseAsync(new MemoryStream(body), cancellationToken: ct);
        Result<InboundMessageResult> result =
            await _orchestrator.ProcessInboundAsync(SocialPlatform.Line, integrationId, companyId, doc, ct);

        if (result is Result<InboundMessageResult>.Failure failure)
            _logger.LogWarning("LINE inbound processing failed: {Error}", failure.Error.Message);

        // Always return 200 to prevent platform retries
        return Ok();
    }

    [HttpPost("api/v1/webhooks/facebook")]
    public IActionResult FacebookWebhook()
        => Ok(new { status = "received" });

    [HttpGet("api/v1/webhooks/facebook")]
    public IActionResult FacebookVerify([FromQuery(Name = "hub.challenge")] string challenge)
        => Ok(challenge);

    [HttpPost("api/v1/webhooks/whatsapp")]
    public IActionResult WhatsAppWebhook()
        => Ok(new { status = "received" });

    [HttpGet("api/v1/webhooks/whatsapp")]
    public IActionResult WhatsAppVerify([FromQuery(Name = "hub.challenge")] string challenge)
        => Ok(challenge);

    [HttpPost("api/v1/webhooks/lazada")]
    public IActionResult LazadaWebhook()
        => Ok(new { status = "received" });

    [HttpPost("api/v1/webhooks/shopee")]
    public IActionResult ShopeeWebhook()
        => Ok(new { status = "received" });

    [HttpPost("api/v1/webhooks/tiktok")]
    public IActionResult TikTokWebhook()
        => Ok(new { status = "received" });

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

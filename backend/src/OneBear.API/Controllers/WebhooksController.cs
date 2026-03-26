using Microsoft.AspNetCore.Mvc;

namespace OneBear.API.Controllers;

[ApiController]
public class WebhooksController : ControllerBase
{
    // ──────────────────────────────────────────────
    // Platform webhooks (anonymous)
    // ──────────────────────────────────────────────

    [HttpPost("api/v1/webhooks/line/{integrationId}")]
    public IActionResult LineWebhook(string integrationId)
        => Ok(new { status = "received" });

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

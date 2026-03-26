using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OneBear.API.Controllers;

[ApiController]
[Route("api/v1/companies/{companyId}/integrations")]
[Authorize]
public class IntegrationsController : ControllerBase
{
    // ──────────────────────────────────────────────
    // Core CRUD
    // ──────────────────────────────────────────────

    /// <summary>List all integrations for a company.</summary>
    [HttpGet]
    public IActionResult ListIntegrations(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    /// <summary>Connect LINE integration.</summary>
    [HttpPost("line")]
    public IActionResult ConnectLine(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "line", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Connect Facebook integration.</summary>
    [HttpPost("facebook")]
    public IActionResult ConnectFacebook(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "facebook", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Connect WhatsApp integration.</summary>
    [HttpPost("whatsapp")]
    public IActionResult ConnectWhatsApp(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "whatsapp", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Connect Lazada integration.</summary>
    [HttpPost("lazada")]
    public IActionResult ConnectLazada(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "lazada", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Connect Shopee integration.</summary>
    [HttpPost("shopee")]
    public IActionResult ConnectShopee(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "shopee", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Connect TikTok integration.</summary>
    [HttpPost("tiktok")]
    public IActionResult ConnectTikTok(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), platform = "tiktok", companyId, status = "connected", createdAt = DateTimeOffset.UtcNow });
    }

    /// <summary>Disconnect (delete) an integration.</summary>
    [HttpDelete("{integrationId}")]
    public IActionResult DeleteIntegration(string companyId, string integrationId)
    {
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Greeting Messages
    // ──────────────────────────────────────────────

    [HttpGet("greeting-messages")]
    public IActionResult GetGreetingMessages(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPut("greeting-messages")]
    public IActionResult UpdateGreetingMessages(string companyId)
    {
        return Ok(new { data = Array.Empty<object>(), updatedAt = DateTimeOffset.UtcNow });
    }

    // ──────────────────────────────────────────────
    // Auto-Replies
    // ──────────────────────────────────────────────

    [HttpGet("auto-replies")]
    public IActionResult GetAutoReplies(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPut("auto-replies")]
    public IActionResult UpdateAutoReplies(string companyId)
    {
        return Ok(new { data = Array.Empty<object>(), updatedAt = DateTimeOffset.UtcNow });
    }

    [HttpGet("auto-replies/comments")]
    public IActionResult GetCommentAutoReplies(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPut("auto-replies/comments")]
    public IActionResult UpdateCommentAutoReplies(string companyId)
    {
        return Ok(new { data = Array.Empty<object>(), updatedAt = DateTimeOffset.UtcNow });
    }

    // ──────────────────────────────────────────────
    // Platform Settings
    // ──────────────────────────────────────────────

    [HttpGet("platform-settings")]
    public IActionResult GetPlatformSettings(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPut("platform-settings")]
    public IActionResult UpdatePlatformSettings(string companyId)
    {
        return Ok(new { data = Array.Empty<object>(), updatedAt = DateTimeOffset.UtcNow });
    }

    // ──────────────────────────────────────────────
    // Auto-Assignment
    // ──────────────────────────────────────────────

    [HttpGet("auto-assignment")]
    public IActionResult GetAutoAssignment(string companyId)
    {
        return Ok(new { enabled = false, strategy = "round-robin", rules = Array.Empty<object>() });
    }

    [HttpPut("auto-assignment")]
    public IActionResult UpdateAutoAssignment(string companyId)
    {
        return Ok(new { enabled = false, strategy = "round-robin", rules = Array.Empty<object>(), updatedAt = DateTimeOffset.UtcNow });
    }

    // ──────────────────────────────────────────────
    // Shortcuts (Quick Replies)
    // ──────────────────────────────────────────────

    [HttpGet("shortcuts")]
    public IActionResult ListShortcuts(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPost("shortcuts")]
    public IActionResult CreateShortcut(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), companyId, name = "", content = "", categoryId = (string?)null, createdAt = DateTimeOffset.UtcNow });
    }

    [HttpPut("shortcuts/{shortcutId}")]
    public IActionResult UpdateShortcut(string companyId, string shortcutId)
    {
        return Ok(new { id = shortcutId, companyId, name = "", content = "", categoryId = (string?)null, updatedAt = DateTimeOffset.UtcNow });
    }

    [HttpDelete("shortcuts/{shortcutId}")]
    public IActionResult DeleteShortcut(string companyId, string shortcutId)
    {
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Shortcut Categories
    // ──────────────────────────────────────────────

    [HttpGet("shortcut-categories")]
    public IActionResult ListShortcutCategories(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPost("shortcut-categories")]
    public IActionResult CreateShortcutCategory(string companyId)
    {
        return StatusCode(201, new { id = Guid.NewGuid().ToString(), companyId, name = "", createdAt = DateTimeOffset.UtcNow });
    }

    [HttpPut("shortcut-categories/{categoryId}")]
    public IActionResult UpdateShortcutCategory(string companyId, string categoryId)
    {
        return Ok(new { id = categoryId, companyId, name = "", updatedAt = DateTimeOffset.UtcNow });
    }

    [HttpDelete("shortcut-categories/{categoryId}")]
    public IActionResult DeleteShortcutCategory(string companyId, string categoryId)
    {
        return NoContent();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class ChatbotController : ControllerBase
{
    // ──────────────────────────────────────────────
    // Chatbot Configuration (company-scoped)
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/configuration")]
    public IActionResult GetConfiguration(string companyId)
    {
        return Ok(new
        {
            companyId,
            enabled = false,
            model = "gpt-4o-mini",
            instructions = "",
            temperature = 0.7,
            maxTokens = 1024,
            knowledgeSourceIds = Array.Empty<string>(),
            createdAt = DateTimeOffset.UtcNow,
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/configuration")]
    public IActionResult CreateConfiguration(string companyId)
    {
        return StatusCode(201, new
        {
            companyId,
            enabled = false,
            model = "gpt-4o-mini",
            instructions = "",
            temperature = 0.7,
            maxTokens = 1024,
            knowledgeSourceIds = Array.Empty<string>(),
            createdAt = DateTimeOffset.UtcNow,
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    [HttpPut("api/v1/companies/{companyId}/chatbot/configuration")]
    public IActionResult UpdateConfiguration(string companyId)
    {
        return Ok(new
        {
            companyId,
            enabled = false,
            model = "gpt-4o-mini",
            instructions = "",
            temperature = 0.7,
            maxTokens = 1024,
            knowledgeSourceIds = Array.Empty<string>(),
            updatedAt = DateTimeOffset.UtcNow
        });
    }

    [HttpPatch("api/v1/companies/{companyId}/chatbot/configuration/instructions")]
    public IActionResult PatchInstructions(string companyId)
    {
        return Ok(new { companyId, instructions = "", updatedAt = DateTimeOffset.UtcNow });
    }

    // ──────────────────────────────────────────────
    // Knowledge Sources (company-scoped)
    // ──────────────────────────────────────────────

    [HttpGet("api/v1/companies/{companyId}/chatbot/knowledge-sources")]
    public IActionResult ListKnowledgeSources(string companyId)
    {
        return Ok(new { data = Array.Empty<object>() });
    }

    [HttpPost("api/v1/companies/{companyId}/chatbot/knowledge-sources")]
    public IActionResult CreateKnowledgeSource(string companyId)
    {
        return StatusCode(201, new
        {
            id = Guid.NewGuid().ToString(),
            companyId,
            name = "",
            type = "file",
            status = "pending",
            createdAt = DateTimeOffset.UtcNow
        });
    }

    [HttpDelete("api/v1/companies/{companyId}/chatbot/knowledge-sources/{sourceId}")]
    public IActionResult DeleteKnowledgeSource(string companyId, string sourceId)
    {
        return NoContent();
    }

    // ──────────────────────────────────────────────
    // Internal / API-key endpoints (no companyId)
    // ──────────────────────────────────────────────

    [AllowAnonymous]
    [HttpPatch("api/v1/chatbot/knowledge-sources/processed")]
    public IActionResult MarkKnowledgeSourceProcessed()
    {
        return Ok(new { status = "updated", updatedAt = DateTimeOffset.UtcNow });
    }

    [AllowAnonymous]
    [HttpPost("api/v1/chatbot/callback/message")]
    public IActionResult ChatbotCallbackMessage()
    {
        return Ok(new { status = "received", timestamp = DateTimeOffset.UtcNow });
    }
}

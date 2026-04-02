using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class AttachmentsController : ControllerBase
{
    /// <summary>Upload an attachment for a company.</summary>
    [HttpPost("api/v1/companies/{companyId}/attachments")]
    public IActionResult UploadAttachment(string companyId)
    {
        return StatusCode(201, new
        {
            id = Guid.NewGuid().ToString(),
            companyId,
            fileName = "stub-file.png",
            contentType = "image/png",
            size = 0L,
            url = $"https://storage.example.com/attachments/{Guid.NewGuid()}",
            createdAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>Get an attachment by ID (public, no company scope).</summary>
    [AllowAnonymous]
    [HttpGet("api/v1/attachments/{attachmentId}")]
    public IActionResult GetAttachment(string attachmentId)
    {
        return Ok(new
        {
            id = attachmentId,
            fileName = "stub-file.png",
            contentType = "image/png",
            size = 0L,
            url = $"https://storage.example.com/attachments/{attachmentId}",
            createdAt = DateTimeOffset.UtcNow
        });
    }
}

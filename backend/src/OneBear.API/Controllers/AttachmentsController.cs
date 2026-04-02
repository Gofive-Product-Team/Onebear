using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OneBear.API.Auth;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

namespace OneBear.API.Controllers;

[ApiController]
[Authorize]
[EnableRateLimiting("api")]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentRepository _attachmentRepo;
    private readonly IBlobStorageService? _blobStorage;
    private const string ContainerName = "attachments";

    public AttachmentsController(
        IAttachmentRepository attachmentRepo,
        IBlobStorageService? blobStorage = null)
    {
        _attachmentRepo = attachmentRepo;
        _blobStorage = blobStorage;
    }

    /// <summary>Upload an attachment for a company.</summary>
    [HttpPost("api/v1/companies/{companyId}/rooms/{roomId}/attachments")]
    [RequestSizeLimit(25 * 1024 * 1024)] // 25MB
    public async Task<IActionResult> UploadAttachment(
        string companyId, string roomId,
        IFormFile file,
        CancellationToken ct)
    {
        if (file.Length == 0)
            return BadRequest(new { error = "Empty file" });

        string userId = User.GetUserId();
        string attachmentId = Guid.NewGuid().ToString();
        string blobName = $"{companyId}/{roomId}/{attachmentId}/{file.FileName}";
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        string fileUrl;
        if (_blobStorage is not null)
        {
            using Stream stream = file.OpenReadStream();
            fileUrl = await _blobStorage.UploadAsync(ContainerName, blobName, stream, file.ContentType, ct);
        }
        else
        {
            // No blob storage configured — return placeholder URL
            fileUrl = $"/api/v1/attachments/{attachmentId}";
        }

        Attachment attachment = new()
        {
            Id = attachmentId,
            RoomId = roomId,
            CompanyId = companyId,
            FileName = file.FileName,
            FileUrl = fileUrl,
            ContentType = file.ContentType,
            Size = file.Length,
            UploadedBy = userId,
            Timestamp = now
        };

        await _attachmentRepo.CreateAsync(attachment, ct);

        return StatusCode(201, new
        {
            id = attachment.Id,
            fileName = attachment.FileName,
            contentType = attachment.ContentType,
            size = attachment.Size,
            url = attachment.FileUrl,
            createdAt = DateTimeOffset.FromUnixTimeMilliseconds(now)
        });
    }

    /// <summary>Get an attachment by ID.</summary>
    [AllowAnonymous]
    [HttpGet("api/v1/attachments/{attachmentId}")]
    public async Task<IActionResult> GetAttachment(string attachmentId, [FromQuery] string? roomId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(roomId))
            return BadRequest(new { error = "roomId query parameter is required" });

        Attachment? attachment = await _attachmentRepo.GetByIdAsync(attachmentId, roomId, ct);
        if (attachment is null)
            return NotFound();

        // If blob storage is configured, generate a SAS URL for direct access
        if (_blobStorage is not null)
        {
            string blobName = $"{attachment.CompanyId}/{attachment.RoomId}/{attachment.Id}/{attachment.FileName}";
            string sasUrl = await _blobStorage.GetSasUrlAsync(ContainerName, blobName, TimeSpan.FromHours(1), ct);
            return Ok(new
            {
                id = attachment.Id,
                fileName = attachment.FileName,
                contentType = attachment.ContentType,
                size = attachment.Size,
                url = sasUrl
            });
        }

        return Ok(new
        {
            id = attachment.Id,
            fileName = attachment.FileName,
            contentType = attachment.ContentType,
            size = attachment.Size,
            url = attachment.FileUrl
        });
    }
}

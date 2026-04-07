namespace OneBear.Application.Common.DTOs;
public record MessageAttachmentDto
{
    public string? FileUrl { get; init; }
    public string? FileName { get; init; }
    public string? ContentType { get; init; }
    public long? Size { get; init; }
    public string? ThumbnailUrl { get; init; }
}

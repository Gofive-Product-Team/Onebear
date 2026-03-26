namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageAttachment
{
    [JsonPropertyName("attachmentId")]
    public string? AttachmentId { get; set; }

    [JsonPropertyName("fileName")]
    public string? FileName { get; set; }

    [JsonPropertyName("contentType")]
    public string? ContentType { get; set; }

    [JsonPropertyName("fileSize")]
    public long? FileSize { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }
}

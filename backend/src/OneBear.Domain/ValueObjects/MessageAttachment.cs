namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageAttachment
{
    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = default!;

    [JsonPropertyName("fileUrl")]
    public string FileUrl { get; set; } = default!;

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = default!;

    [JsonPropertyName("size")]
    public long Size { get; set; }
}

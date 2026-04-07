namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class Attachment : MongoEntity
{
    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("messageId")]
    public string MessageId { get; set; } = default!;

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

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

    [JsonPropertyName("uploadedBy")]
    public string UploadedBy { get; set; } = default!;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}

namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class Attachment : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

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

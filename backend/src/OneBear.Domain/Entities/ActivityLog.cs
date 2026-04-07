namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class ActivityLog : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("customerId")]
    public string CustomerId { get; set; } = default!;

    /// <summary>"chat", "order", "payment", "followup", "note", "tag_change", "status_change"</summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;

    [JsonPropertyName("description")]
    public string Description { get; set; } = default!;

    /// <summary>userId, "system", or "ai"</summary>
    [JsonPropertyName("actorId")]
    public string? ActorId { get; set; }

    [JsonPropertyName("actorName")]
    public string? ActorName { get; set; }

    /// <summary>messageId, orderId, etc.</summary>
    [JsonPropertyName("referenceId")]
    public string? ReferenceId { get; set; }

    /// <summary>"message", "order", "room"</summary>
    [JsonPropertyName("referenceType")]
    public string? ReferenceType { get; set; }

    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}

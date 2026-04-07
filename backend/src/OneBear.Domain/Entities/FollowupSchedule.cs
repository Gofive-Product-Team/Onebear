namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class FollowupSchedule : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("scheduledTimestamp")]
    public long ScheduledTimestamp { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("createdBy")]
    public string CreatedBy { get; set; } = default!;

    [JsonPropertyName("isProcessed")]
    public bool IsProcessed { get; set; }

    [JsonPropertyName("processedTimestamp")]
    public long? ProcessedTimestamp { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("cancelledBy")]
    public string? CancelledBy { get; set; }

    [JsonPropertyName("cancelledTimestamp")]
    public long? CancelledTimestamp { get; set; }
}

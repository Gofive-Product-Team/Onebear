namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class UnansweredQuestion : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("question")]
    public string Question { get; set; } = "";

    [JsonPropertyName("frequency")]
    public int Frequency { get; set; }

    [JsonPropertyName("lastAskedTimestamp")]
    public long LastAskedTimestamp { get; set; }

    [JsonPropertyName("lastRoomId")]
    public string? LastRoomId { get; set; }
}

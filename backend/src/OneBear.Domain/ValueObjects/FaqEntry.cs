namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class FaqEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("question")]
    public string Question { get; set; } = "";

    [JsonPropertyName("answer")]
    public string Answer { get; set; } = "";

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

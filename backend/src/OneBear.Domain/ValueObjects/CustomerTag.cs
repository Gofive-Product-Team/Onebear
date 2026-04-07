namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class CustomerTag
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("isAiAssigned")]
    public bool IsAiAssigned { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("assignedTimestamp")]
    public long AssignedTimestamp { get; set; }

    [JsonPropertyName("assignedBy")]
    public string? AssignedBy { get; set; }
}

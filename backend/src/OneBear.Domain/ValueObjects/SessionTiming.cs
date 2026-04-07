namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class SessionTiming
{
    [JsonPropertyName("frtMs")]
    public long FrtMs { get; set; }

    [JsonPropertyName("rtMs")]
    public long RtMs { get; set; }

    [JsonPropertyName("resolvedBy")]
    public string? ResolvedBy { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}

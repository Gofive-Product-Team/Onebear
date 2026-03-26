namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageReferral
{
    [JsonPropertyName("source")]
    public string? Source { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("adId")]
    public string? AdId { get; set; }

    [JsonPropertyName("ref")]
    public string? Ref { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }
}

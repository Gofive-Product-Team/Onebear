namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoReply
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("delaySeconds")]
    public int DelaySeconds { get; set; }
}

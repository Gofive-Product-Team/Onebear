namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class GreetingMessage
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

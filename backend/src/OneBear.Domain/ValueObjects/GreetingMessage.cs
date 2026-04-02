namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class GreetingMessage
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = default!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;

    [JsonPropertyName("attachmentUrl")]
    public string? AttachmentUrl { get; set; }

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }
}

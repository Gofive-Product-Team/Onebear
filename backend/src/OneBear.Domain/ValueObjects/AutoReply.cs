namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoReply
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("triggerType")]
    public string TriggerType { get; set; } = default!;

    [JsonPropertyName("keywords")]
    public List<string>? Keywords { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = default!;

    [JsonPropertyName("attachmentUrl")]
    public string? AttachmentUrl { get; set; }
}

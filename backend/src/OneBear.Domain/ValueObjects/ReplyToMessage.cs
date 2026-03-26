namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class ReplyToMessage
{
    [JsonPropertyName("messageId")]
    public string MessageId { get; set; } = default!;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("messageType")]
    public string? MessageType { get; set; }

    [JsonPropertyName("senderName")]
    public string? SenderName { get; set; }
}

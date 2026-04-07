namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class AiActivityLog : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("roomId")]
    public string? RoomId { get; set; }

    [JsonPropertyName("messageId")]
    public string? MessageId { get; set; }

    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = "";

    [JsonPropertyName("requestPayload")]
    public string? RequestPayload { get; set; }

    [JsonPropertyName("responsePayload")]
    public string? ResponsePayload { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("promptTokens")]
    public int? PromptTokens { get; set; }

    [JsonPropertyName("completionTokens")]
    public int? CompletionTokens { get; set; }

    [JsonPropertyName("actorId")]
    public string? ActorId { get; set; }

    [JsonPropertyName("actorName")]
    public string? ActorName { get; set; }

    [JsonPropertyName("confidence")]
    public double? Confidence { get; set; }

    [JsonPropertyName("handoffReason")]
    public string? HandoffReason { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}

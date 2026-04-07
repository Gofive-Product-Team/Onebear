namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class ChatSession
{
    [JsonPropertyName("startTimestamp")]
    public long StartTimestamp { get; set; }

    [JsonPropertyName("endTimestamp")]
    public long? EndTimestamp { get; set; }

    [JsonPropertyName("agentUserId")]
    public string AgentUserId { get; set; } = default!;
}

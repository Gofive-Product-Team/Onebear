namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoAssignmentSettings
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "roundRobin";

    [JsonPropertyName("agentUserIds")]
    public List<string> AgentUserIds { get; set; } = new();
}

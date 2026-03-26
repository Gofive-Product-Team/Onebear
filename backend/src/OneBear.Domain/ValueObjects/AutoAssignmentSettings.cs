namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class AutoAssignmentSettings
{
    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("strategy")]
    public string Strategy { get; set; } = "round-robin";

    [JsonPropertyName("userIds")]
    public List<string> UserIds { get; set; } = new();
}

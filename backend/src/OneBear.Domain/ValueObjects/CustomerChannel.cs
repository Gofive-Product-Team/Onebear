namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class CustomerChannel
{
    [JsonPropertyName("chatUserId")]
    public string ChatUserId { get; set; } = default!;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("externalId")]
    public string? ExternalId { get; set; }

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }
}

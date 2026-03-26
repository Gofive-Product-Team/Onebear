namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageMention
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("displayName")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("offset")]
    public int Offset { get; set; }

    [JsonPropertyName("length")]
    public int Length { get; set; }
}

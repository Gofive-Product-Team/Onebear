namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class Shortcut
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("categoryId")]
    public string? CategoryId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("content")]
    public string Content { get; set; } = default!;

    [JsonPropertyName("shortcutKey")]
    public string? ShortcutKey { get; set; }
}

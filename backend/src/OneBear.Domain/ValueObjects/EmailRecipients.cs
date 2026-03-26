namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class EmailRecipients
{
    [JsonPropertyName("from")]
    public string? From { get; set; }

    [JsonPropertyName("to")]
    public List<string> To { get; set; } = new();

    [JsonPropertyName("cc")]
    public List<string> Cc { get; set; } = new();

    [JsonPropertyName("bcc")]
    public List<string> Bcc { get; set; } = new();
}

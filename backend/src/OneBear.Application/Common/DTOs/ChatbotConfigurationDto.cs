namespace OneBear.Application.Common.DTOs;

public class ChatbotConfigurationDto
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public bool IsEnabled { get; set; }
    public string? Provider { get; set; }
    public string? ModelId { get; set; }
    public string? SystemPrompt { get; set; }
    public long CreatedTimestamp { get; set; }
}

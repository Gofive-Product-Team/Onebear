namespace OneBear.Application.Common.DTOs;

public class CompanyFeatureSettingsDto
{
    public string Id { get; set; } = default!;
    public string CompanyId { get; set; } = default!;
    public bool AutoAssignEnabled { get; set; }
    public bool GreetingEnabled { get; set; }
    public bool AutoReplyEnabled { get; set; }
    public bool ChatbotEnabled { get; set; }
}

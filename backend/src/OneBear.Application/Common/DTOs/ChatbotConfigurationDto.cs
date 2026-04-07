namespace OneBear.Application.Common.DTOs;

using OneBear.Domain.ValueObjects;

public class ChatbotConfigurationDto
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public bool IsEnabled { get; set; }
    public string? Provider { get; set; }
    public string? ModelId { get; set; }
    public string? SystemPrompt { get; set; }
    public long CreatedTimestamp { get; set; }

    // AI Tone/Persona
    public string Tone { get; set; } = "casual";

    // FAQ entries
    public List<FaqEntry> FaqEntries { get; set; } = new();

    // Upsell/Cross-sell config
    public bool UpsellEnabled { get; set; } = true;
    public int UpsellMaxPricePercent { get; set; } = 50;
    public bool CrossSellEnabled { get; set; } = true;
    public int CrossSellMaxItems { get; set; } = 2;
    public int PaymentLinkExpiryHours { get; set; } = 24;

    // Follow-up config
    public bool FollowUpEnabled { get; set; }
    public int FollowUpDelayMinutes { get; set; } = 120;
    public string FollowUpWindowStart { get; set; } = "09:00";
    public string FollowUpWindowEnd { get; set; } = "21:00";
    public int FollowUpMaxAttempts { get; set; } = 2;
    public string? FollowUpTemplate { get; set; }
}

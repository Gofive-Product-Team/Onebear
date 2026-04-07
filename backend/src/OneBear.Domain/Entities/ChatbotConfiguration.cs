namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.ValueObjects;

public class ChatbotConfiguration : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("isEnabled")]
    public bool IsEnabled { get; set; }

    [JsonPropertyName("scheduleMode")]
    public string ScheduleMode { get; set; } = "always";

    [JsonPropertyName("daySchedules")]
    public List<DaySchedule> DaySchedules { get; set; } = new();

    [JsonPropertyName("businessOverview")]
    public string? BusinessOverview { get; set; }

    [JsonPropertyName("responseStyle")]
    public string? ResponseStyle { get; set; }

    [JsonPropertyName("instructions")]
    public string? Instructions { get; set; }

    [JsonPropertyName("knowledgeSources")]
    public List<KnowledgeSource> KnowledgeSources { get; set; } = new();

    // AI Tone/Persona
    [JsonPropertyName("tone")]
    public string Tone { get; set; } = "casual"; // casual | formal | cute

    // FAQ entries
    [JsonPropertyName("faqEntries")]
    public List<FaqEntry> FaqEntries { get; set; } = new();

    // Upsell/Cross-sell config
    [JsonPropertyName("upsellEnabled")]
    public bool UpsellEnabled { get; set; } = true;

    [JsonPropertyName("upsellMaxPricePercent")]
    public int UpsellMaxPricePercent { get; set; } = 50;

    [JsonPropertyName("crossSellEnabled")]
    public bool CrossSellEnabled { get; set; } = true;

    [JsonPropertyName("crossSellMaxItems")]
    public int CrossSellMaxItems { get; set; } = 2;

    [JsonPropertyName("paymentLinkExpiryHours")]
    public int PaymentLinkExpiryHours { get; set; } = 24;

    // Follow-up config
    [JsonPropertyName("followUpEnabled")]
    public bool FollowUpEnabled { get; set; }

    [JsonPropertyName("followUpDelayMinutes")]
    public int FollowUpDelayMinutes { get; set; } = 120;

    [JsonPropertyName("followUpWindowStart")]
    public string FollowUpWindowStart { get; set; } = "09:00";

    [JsonPropertyName("followUpWindowEnd")]
    public string FollowUpWindowEnd { get; set; } = "21:00";

    [JsonPropertyName("followUpMaxAttempts")]
    public int FollowUpMaxAttempts { get; set; } = 2;

    [JsonPropertyName("followUpTemplate")]
    public string? FollowUpTemplate { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

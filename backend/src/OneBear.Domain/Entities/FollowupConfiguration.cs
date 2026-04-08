namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

/// <summary>
/// Per-company follow-up configuration with per-channel rules.
/// Each channel has independent settings (enable/disable, send window, trigger delay, messages).
/// </summary>
public class FollowupConfiguration : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("channelRules")]
    public List<FollowupChannelRule> ChannelRules { get; set; } = new();

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

public class FollowupChannelRule
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("sendWindowStart")]
    public string SendWindowStart { get; set; } = "09:00"; // HH:mm Bangkok time

    [JsonPropertyName("sendWindowEnd")]
    public string SendWindowEnd { get; set; } = "21:00";

    [JsonPropertyName("triggerDelayHours")]
    public int TriggerDelayHours { get; set; } = 2; // 1-24

    [JsonPropertyName("maxAttempts")]
    public int MaxAttempts { get; set; } = 2; // 1-5

    [JsonPropertyName("debounceHours")]
    public int DebounceHours { get; set; } = 4; // 2-48

    [JsonPropertyName("attempts")]
    public List<FollowupAttemptTemplate> Attempts { get; set; } = new();
}

public class FollowupAttemptTemplate
{
    [JsonPropertyName("number")]
    public int Number { get; set; } = 1;

    [JsonPropertyName("delayHours")]
    public int DelayHours { get; set; } // hours after previous attempt

    [JsonPropertyName("messageTemplate")]
    public string MessageTemplate { get; set; } = "";
    // Supports: {{product_name}}, {{product_price}}, {{product_stock}}, {{customer_name}}, {{discount_percent}}
}

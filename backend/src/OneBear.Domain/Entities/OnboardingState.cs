namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

/// <summary>
/// Tracks a user's onboarding progress. Cleared after 2 hours of inactivity (GAP 38).
/// </summary>
public class OnboardingState : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("currentStep")]
    public int CurrentStep { get; set; } = 1; // 1=Connect Channel, 2=AI Ready, 3=Done

    [JsonPropertyName("isCompleted")]
    public bool IsCompleted { get; set; }

    // Step 1: Connected channels
    [JsonPropertyName("connectedChannels")]
    public List<OnboardingChannel> ConnectedChannels { get; set; } = new();

    [JsonPropertyName("testMessageReceived")]
    public bool TestMessageReceived { get; set; }

    // Step 2: AI + Products
    [JsonPropertyName("aiEnabled")]
    public bool AiEnabled { get; set; } = true; // AI ON by default (no toggle)

    [JsonPropertyName("sampleProductCreated")]
    public bool SampleProductCreated { get; set; }

    [JsonPropertyName("pendingProducts")]
    public List<OnboardingProduct> PendingProducts { get; set; } = new(); // staged before save (GAP 39)

    [JsonPropertyName("csvImported")]
    public bool CsvImported { get; set; }

    // AI capability flags (GAP 37)
    [JsonPropertyName("canAnswerFaq")]
    public bool CanAnswerFaq { get; set; } = true;

    [JsonPropertyName("canCloseOrders")]
    public bool CanCloseOrders { get; set; } // false until real products added

    // Step 3: Tutorial
    [JsonPropertyName("tutorialDismissed")]
    public bool TutorialDismissed { get; set; }

    [JsonPropertyName("tutorialsDismissed")]
    public List<string> TutorialsDismissed { get; set; } = new(); // "settings", "payment", "products", "followup"

    // Session management (GAP 38)
    [JsonPropertyName("lastActivityTimestamp")]
    public long LastActivityTimestamp { get; set; }

    [JsonPropertyName("expiresAtTimestamp")]
    public long ExpiresAtTimestamp { get; set; } // lastActivity + 2 hours

    // Audit
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    public bool IsExpired => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() > ExpiresAtTimestamp;

    public void TouchActivity()
    {
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        LastActivityTimestamp = now;
        ExpiresAtTimestamp = now + (2 * 60 * 60 * 1000); // 2 hours
    }
}

public class OnboardingChannel
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("channelName")]
    public string? ChannelName { get; set; }

    [JsonPropertyName("integrationId")]
    public string? IntegrationId { get; set; }

    [JsonPropertyName("connectedTimestamp")]
    public long ConnectedTimestamp { get; set; }

    [JsonPropertyName("testMessageReceived")]
    public bool TestMessageReceived { get; set; }
}

public class OnboardingProduct
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("category")]
    public string Category { get; set; } = "General";

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("stock")]
    public int? Stock { get; set; }
}

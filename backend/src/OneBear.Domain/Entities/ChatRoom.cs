namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class ChatRoom : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("assignToUserId")]
    public string? AssignToUserId { get; set; }

    [JsonPropertyName("state")]
    public string State { get; set; } = Enums.ChatState.New;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("integrationId")]
    public string IntegrationId { get; set; } = default!;

    [JsonPropertyName("unread")]
    public int Unread { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("userMessageTimestamp")]
    public long? UserMessageTimestamp { get; set; }

    [JsonPropertyName("lastMessageTimestamp")]
    public long? LastMessageTimestamp { get; set; }

    [JsonPropertyName("followupTimestamp")]
    public long? FollowupTimestamp { get; set; }

    [JsonPropertyName("followupContent")]
    public string? FollowupContent { get; set; }

    [JsonPropertyName("participantUserIds")]
    public List<string> ParticipantUserIds { get; set; } = new();

    [JsonPropertyName("attendedUserIds")]
    public List<string> AttendedUserIds { get; set; } = new();

    [JsonPropertyName("customer")]
    public RoomCustomer? Customer { get; set; }

    [JsonPropertyName("tags")]
    public List<RoomTag> Tags { get; set; } = new();

    [JsonPropertyName("sessions")]
    public List<ChatSession> Sessions { get; set; } = new();

    [JsonPropertyName("isAiMuted")]
    public bool IsAiMuted { get; set; }

    [JsonPropertyName("isPinned")]
    public bool IsPinned { get; set; }

    [JsonPropertyName("pinnedTimestamp")]
    public long? PinnedTimestamp { get; set; }

    [JsonPropertyName("pinnedByUserId")]
    public string? PinnedByUserId { get; set; }

    [JsonPropertyName("handoffSource")]
    public string? HandoffSource { get; set; }

    [JsonPropertyName("handoffSourceName")]
    public string? HandoffSourceName { get; set; }

    [JsonPropertyName("handoffTimestamp")]
    public long? HandoffTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

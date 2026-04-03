namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;
using OneBear.Domain.ValueObjects;

public class ChatMessage : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = default!;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("type")]
    public string Type { get; set; } = Enums.MessageType.Text;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("mid")]
    public string? Mid { get; set; }

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("traceId")]
    public string? TraceId { get; set; }

    [JsonPropertyName("deliveryStatus")]
    public string DeliveryStatus { get; set; } = Enums.MessageDeliveryState.Pending;

    [JsonPropertyName("deliveryError")]
    public string? DeliveryError { get; set; }

    [JsonPropertyName("attachment")]
    public MessageAttachment? Attachment { get; set; }

    [JsonPropertyName("replyTo")]
    public ReplyToMessage? ReplyTo { get; set; }

    [JsonPropertyName("product")]
    public MessageProduct? Product { get; set; }

    [JsonPropertyName("order")]
    public MessageOrder? Order { get; set; }

    [JsonPropertyName("referral")]
    public MessageReferral? Referral { get; set; }

    [JsonPropertyName("mentions")]
    public List<MessageMention>? Mentions { get; set; }

    [JsonPropertyName("emailRecipients")]
    public EmailRecipients? EmailRecipients { get; set; }

    [JsonPropertyName("isEdited")]
    public bool IsEdited { get; set; }

    [JsonPropertyName("editedTimestamp")]
    public long? EditedTimestamp { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("deletedTimestamp")]
    public long? DeletedTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

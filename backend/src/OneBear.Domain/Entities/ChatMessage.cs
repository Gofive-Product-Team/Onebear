namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.ValueObjects;

public class ChatMessage : CosmosEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("_schemaVersion")]
    public int SchemaVersion { get; set; } = 1;

    [JsonPropertyName("roomId")]
    public string RoomId { get; set; } = default!;

    [JsonPropertyName("integrationId")]
    public string IntegrationId { get; set; } = default!;

    [JsonPropertyName("platform")]
    public string Platform { get; set; } = default!;

    [JsonPropertyName("messageType")]
    public string MessageType { get; set; } = Enums.MessageType.Text;

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("senderUserId")]
    public string? SenderUserId { get; set; }

    [JsonPropertyName("senderType")]
    public string SenderType { get; set; } = Enums.UserType.Customer;

    [JsonPropertyName("senderName")]
    public string? SenderName { get; set; }

    [JsonPropertyName("senderPictureUrl")]
    public string? SenderPictureUrl { get; set; }

    [JsonPropertyName("deliveryState")]
    public string DeliveryState { get; set; } = Enums.MessageDeliveryState.Pending;

    [JsonPropertyName("externalMessageId")]
    public string? ExternalMessageId { get; set; }

    [JsonPropertyName("attachments")]
    public List<MessageAttachment> Attachments { get; set; } = new();

    [JsonPropertyName("replyTo")]
    public ReplyToMessage? ReplyTo { get; set; }

    [JsonPropertyName("mentions")]
    public List<MessageMention> Mentions { get; set; } = new();

    [JsonPropertyName("emailRecipients")]
    public EmailRecipients? EmailRecipients { get; set; }

    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("product")]
    public MessageProduct? Product { get; set; }

    [JsonPropertyName("order")]
    public MessageOrder? Order { get; set; }

    [JsonPropertyName("referral")]
    public MessageReferral? Referral { get; set; }

    [JsonPropertyName("reaction")]
    public string? Reaction { get; set; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }
}

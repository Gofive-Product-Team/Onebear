namespace OneBear.Domain.ValueObjects;

public record NormalizedMessage
{
    public string ExternalUserId { get; init; } = default!;
    public string? Content { get; init; }
    public string MessageType { get; init; } = default!;
    public MessageAttachment? Attachment { get; init; }
    public string? PlatformMessageId { get; init; }
    public long Timestamp { get; init; }
    public ReplyToMessage? ReplyTo { get; init; }
    public MessageProduct? Product { get; init; }
    public MessageOrder? Order { get; init; }
    public MessageReferral? Referral { get; init; }
    public bool IsEcho { get; init; }
    public string? DisplayName { get; init; }
    public string? PictureUrl { get; init; }
}

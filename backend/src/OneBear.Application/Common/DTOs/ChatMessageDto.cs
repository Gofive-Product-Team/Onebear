namespace OneBear.Application.Common.DTOs;

public class ChatMessageDto
{
    public string Id { get; set; } = default!;
    public string RoomId { get; set; } = default!;
    public string? Content { get; set; }
    public string Type { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public string DeliveryStatus { get; set; } = default!;
    public string? SenderName { get; set; }
    public string? SenderType { get; set; }
    public long Timestamp { get; set; }
    public string? Mid { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsPinnedByUser { get; set; }
    public long? MessagePinnedTimestamp { get; set; }
    public MessageAttachmentDto? Attachment { get; set; }
    public ReplyToMessageDto? ReplyTo { get; set; }
    public MessageProductDto? Product { get; set; }
    public MessageOrderDto? Order { get; set; }
}

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
}

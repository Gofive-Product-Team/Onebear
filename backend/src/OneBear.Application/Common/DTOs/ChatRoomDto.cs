namespace OneBear.Application.Common.DTOs;

public class ChatRoomDto
{
    public string Id { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public string State { get; set; } = default!;
    public string? AssignToUserId { get; set; }
    public int UnreadCount { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerAvatar { get; set; }
    public long CreatedTimestamp { get; set; }
    public long? LastMessageTimestamp { get; set; }
}

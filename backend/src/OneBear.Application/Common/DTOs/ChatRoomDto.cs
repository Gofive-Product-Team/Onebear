namespace OneBear.Application.Common.DTOs;

public class ChatRoomDto
{
    public string Id { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public string State { get; set; } = default!;
    public string? AssignToUserId { get; set; }
    public string? IntegrationId { get; set; }
    public int UnreadCount { get; set; }
    public int Unread { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerAvatar { get; set; }
    public RoomCustomerDto? Customer { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool IsAiMuted { get; set; }
    public long? FollowupTimestamp { get; set; }
    public long CreatedTimestamp { get; set; }
    public long? LastMessageTimestamp { get; set; }
    public bool IsPinned { get; set; }
    public long? PinnedTimestamp { get; set; }
    public string? HandoffSource { get; set; }
    public string? HandoffSourceName { get; set; }
    public long? HandoffTimestamp { get; set; }
}

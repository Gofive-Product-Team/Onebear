namespace OneBear.Application.Common.DTOs;

using OneBear.Domain.ValueObjects;

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
    public string? FollowupContent { get; set; }
    public long CreatedTimestamp { get; set; }
    public string? LastMessage { get; set; }
    public long? LastMessageTimestamp { get; set; }
    public bool IsPinned { get; set; }
    public long? PinnedTimestamp { get; set; }
    public string? HandoffSource { get; set; }
    public string? HandoffSourceName { get; set; }
    public long? HandoffTimestamp { get; set; }

    // FRT/RT timer fields
    public long? FrtStartTimestamp { get; set; }
    public long? FrtEndTimestamp { get; set; }
    public long? FrtDurationMs { get; set; }
    public bool IsFrtStopped { get; set; }
    public long? RtEndTimestamp { get; set; }
    public long? RtDurationMs { get; set; }
    public bool IsResolved { get; set; }
    public List<SessionTiming> SessionTimings { get; set; } = new();
    public bool IsSpam { get; set; }
    public double? SpamScore { get; set; }
}

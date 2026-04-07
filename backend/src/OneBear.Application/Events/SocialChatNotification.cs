namespace OneBear.Application.Events;

public record SocialChatNotification
{
    public string RoomId { get; init; } = default!;
    public string MessageId { get; init; } = default!;
    public string CompanyId { get; init; } = default!;
    public string? AssignedUserId { get; init; }
    public List<string> ParticipantUserIds { get; init; } = new();
    public string MessageContent { get; init; } = default!;
    public string SenderDisplayName { get; init; } = default!;
    public string Platform { get; init; } = default!;
}

namespace OneBear.Application.Messaging.Commands;

public record SendMessageCommand(
    string RoomId,
    string Content,
    string? MessageType,
    string? AttachmentId,
    string[]? MentionedUserIds);

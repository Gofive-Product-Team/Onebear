namespace OneBear.Application.Messaging;

using OneBear.Application.Common.DTOs;
using OneBear.Domain.Entities;

public static class MessageMappingHelpers
{
    public static ChatMessageDto ToDto(ChatMessage msg, ChatUser? sender = null) => new()
    {
        Id = msg.Id,
        RoomId = msg.RoomId,
        Content = msg.Content,
        Type = msg.Type,
        Platform = msg.Platform,
        DeliveryStatus = msg.DeliveryStatus,
        SenderName = sender?.DisplayName,
        SenderType = sender?.Type,
        Timestamp = msg.Timestamp
    };

    public static ChatRoomDto ToDto(ChatRoom room) => new()
    {
        Id = room.Id,
        Platform = room.Platform,
        State = room.State,
        AssignToUserId = room.AssignToUserId,
        UnreadCount = room.Unread,
        CustomerName = room.Customer?.Name,
        CustomerAvatar = room.Customer?.PictureUrl,
        CreatedTimestamp = room.CreatedTimestamp,
        LastMessageTimestamp = room.LastMessageTimestamp
    };
}

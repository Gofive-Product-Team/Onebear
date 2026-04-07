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
        Timestamp = msg.Timestamp,
        Mid = msg.Mid,
        IsEdited = msg.IsEdited,
        IsDeleted = msg.IsDeleted,
        Attachment = msg.Attachment is not null ? new MessageAttachmentDto
        {
            FileUrl = msg.Attachment.FileUrl,
            FileName = msg.Attachment.FileName,
            ContentType = msg.Attachment.ContentType,
            Size = msg.Attachment.Size,
            ThumbnailUrl = msg.Attachment.ThumbnailUrl
        } : null,
        ReplyTo = msg.ReplyTo is not null ? new ReplyToMessageDto
        {
            MessageId = msg.ReplyTo.MessageId,
            Content = msg.ReplyTo.Content,
            SenderName = msg.ReplyTo.SenderName
        } : null,
        Product = msg.Product is not null ? new MessageProductDto
        {
            Name = msg.Product.Name,
            ImageUrl = msg.Product.ImageUrl,
            Price = msg.Product.Price,
            Url = msg.Product.Url
        } : null,
        Order = msg.Order is not null ? new MessageOrderDto
        {
            OrderId = msg.Order.OrderId,
            Total = msg.Order.TotalAmount,
            Status = msg.Order.Status,
            Currency = msg.Order.Currency
        } : null,
    };

    public static ChatRoomDto ToDto(ChatRoom room) => new()
    {
        Id = room.Id,
        Platform = room.Platform,
        State = room.State,
        AssignToUserId = room.AssignToUserId,
        IntegrationId = room.IntegrationId,
        UnreadCount = room.Unread,
        Unread = room.Unread,
        CustomerName = room.Customer?.Name,
        CustomerAvatar = room.Customer?.PictureUrl,
        Customer = room.Customer is not null ? new RoomCustomerDto
        {
            Name = room.Customer.Name,
            Avatar = room.Customer.PictureUrl,
            Platform = room.Platform
        } : null,
        Tags = room.Tags?.Select(t => t.Name).ToList() ?? new(),
        IsAiMuted = room.IsAiMuted,
        FollowupTimestamp = room.FollowupTimestamp,
        CreatedTimestamp = room.CreatedTimestamp,
        LastMessageTimestamp = room.LastMessageTimestamp
    };
}

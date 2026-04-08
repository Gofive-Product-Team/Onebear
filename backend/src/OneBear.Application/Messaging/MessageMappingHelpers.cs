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
        SenderName = sender?.DisplayName ?? (msg.IsAiMessage ? "AI" : null),
        SenderType = sender?.Type ?? InferSenderType(msg),
        Timestamp = msg.Timestamp,
        Mid = msg.Mid,
        IsEdited = msg.IsEdited,
        IsDeleted = msg.IsDeleted,
        IsPinnedByUser = msg.IsPinnedByUser,
        MessagePinnedTimestamp = msg.MessagePinnedTimestamp,
        IsAiMessage = msg.IsAiMessage,
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

    /// <summary>Infer sender type when ChatUser is not available (e.g., admin without ChatUser record).</summary>
    private static string? InferSenderType(ChatMessage msg)
    {
        if (msg.IsAiMessage || msg.CreatedBy == "ai" || msg.UserId == "ai-chatbot")
            return "Agent";
        if (msg.Type == "system" || msg.CreatedBy == "system")
            return "System";
        // If message was sent outbound (has delivery status tracking) and not from a known customer,
        // it's from an agent (admin sent via the web UI)
        if (msg.DeliveryStatus == Domain.Enums.MessageDeliveryState.Delivered
            || msg.DeliveryStatus == Domain.Enums.MessageDeliveryState.Pending
            || msg.DeliveryStatus == Domain.Enums.MessageDeliveryState.Failed)
        {
            // Outbound messages from agents won't have a ChatUser record
            // but they do have a UserId that's the Keycloak sub (UUID format)
            if (msg.UserId is not null && msg.UserId.Contains('-') && msg.UserId.Length > 30)
                return "Agent";
        }
        return null;
    }

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
        FollowupContent = room.FollowupContent,
        CreatedTimestamp = room.CreatedTimestamp,
        LastMessage = room.LastMessageContent,
        LastMessageTimestamp = room.LastMessageTimestamp,
        IsPinned = room.IsPinned,
        PinnedTimestamp = room.PinnedTimestamp,
        HandoffSource = room.HandoffSource,
        HandoffSourceName = room.HandoffSourceName,
        HandoffTimestamp = room.HandoffTimestamp,
        FrtStartTimestamp = room.FrtStartTimestamp,
        FrtEndTimestamp = room.FrtEndTimestamp,
        FrtDurationMs = room.FrtDurationMs,
        IsFrtStopped = room.IsFrtStopped,
        RtEndTimestamp = room.RtEndTimestamp,
        RtDurationMs = room.RtDurationMs,
        IsResolved = room.IsResolved,
        SessionTimings = room.SessionTimings,
        IsSpam = room.IsSpam,
        SpamScore = room.SpamScore
    };
}

namespace OneBear.Application.Messaging;

using OneBear.Application.Common.DTOs;

public record InboundMessageResult
{
    public ChatRoomDto Room { get; init; } = default!;
    public ChatMessageDto Message { get; init; } = default!;
    public bool IsNewRoom { get; init; }
}

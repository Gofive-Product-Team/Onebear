namespace OneBear.Application.RealTime.Dtos;

public record TypingIndicatorDto
{
    public required string UserId { get; init; }
    public required string DisplayName { get; init; }
    public required string RoomId { get; init; }
    public required bool IsTyping { get; init; }
}

namespace OneBear.Application.RealTime.Dtos;

public record MessageStatusDto
{
    public required string MessageId { get; init; }
    public required string RoomId { get; init; }
    public required string DeliveryStatus { get; init; }
    public string? DeliveryError { get; init; }
    public string? PlatformMessageId { get; init; }
}

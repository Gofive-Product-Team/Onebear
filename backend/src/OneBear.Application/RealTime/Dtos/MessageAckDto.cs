namespace OneBear.Application.RealTime.Dtos;

public record MessageAckDto
{
    public required string MessageId { get; init; }
    public required string RoomId { get; init; }
    public required long Timestamp { get; init; }
    public required long Seq { get; init; }
    public required string DeliveryStatus { get; init; }
    public required string IdempotencyKey { get; init; }
}

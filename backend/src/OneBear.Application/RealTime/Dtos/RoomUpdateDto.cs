namespace OneBear.Application.RealTime.Dtos;

public record RoomUpdateDto
{
    public required string RoomId { get; init; }
    public required Dictionary<string, object?> Changes { get; init; }
}

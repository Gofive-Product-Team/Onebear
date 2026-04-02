namespace OneBear.Application.RealTime.Dtos;

public record ConnectedDto
{
    public required string UserId { get; init; }
    public required string ConnectionId { get; init; }
    public required DateTimeOffset ServerTime { get; init; }
}

namespace OneBear.Application.RealTime.Dtos;

public record AttendanceDto
{
    public required string UserId { get; init; }
    public required string DisplayName { get; init; }
    public required string RoomId { get; init; }
    public required bool IsAttending { get; init; }
    public required string ConnectionId { get; init; }
}

namespace OneBear.Application.Common.Interfaces;

public interface IAttendanceService
{
    Task RecordAttendAsync(string connectionId, string roomId, string userId);
    Task RecordExitAsync(string connectionId, string roomId);
    Task<IReadOnlyList<string>> GetAttendedRoomsAsync(string connectionId);
    Task ExitAllRoomsForConnectionAsync(string connectionId);
}

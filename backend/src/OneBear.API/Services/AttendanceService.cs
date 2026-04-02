using System.Collections.Concurrent;
using OneBear.Application.Common.Interfaces;

namespace OneBear.API.Services;

public class AttendanceService : IAttendanceService
{
    // connectionId -> set of roomIds
    private readonly ConcurrentDictionary<string, ConcurrentBag<string>> _attendance = new();

    public Task RecordAttendAsync(string connectionId, string roomId, string userId)
    {
        ConcurrentBag<string> rooms = _attendance.GetOrAdd(connectionId, _ => new ConcurrentBag<string>());
        if (!rooms.Contains(roomId))
        {
            rooms.Add(roomId);
        }
        return Task.CompletedTask;
    }

    public Task RecordExitAsync(string connectionId, string roomId)
    {
        if (_attendance.TryGetValue(connectionId, out ConcurrentBag<string>? rooms))
        {
            // ConcurrentBag doesn't support remove, so rebuild
            List<string> remaining = rooms.Where(r => r != roomId).ToList();
            _attendance[connectionId] = new ConcurrentBag<string>(remaining);
        }
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<string>> GetAttendedRoomsAsync(string connectionId)
    {
        if (_attendance.TryGetValue(connectionId, out ConcurrentBag<string>? rooms))
        {
            return Task.FromResult<IReadOnlyList<string>>(rooms.ToList());
        }
        return Task.FromResult<IReadOnlyList<string>>(Array.Empty<string>());
    }

    public Task ExitAllRoomsForConnectionAsync(string connectionId)
    {
        _attendance.TryRemove(connectionId, out _);
        return Task.CompletedTask;
    }
}

namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using Quartz;

[DisallowConcurrentExecution]
public class AttendedUserCleanupJob : IJob
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromMinutes(15);

    private readonly IChatRoomRepository _roomRepo;
    private readonly ILogger<AttendedUserCleanupJob> _logger;

    public AttendedUserCleanupJob(
        IChatRoomRepository roomRepo,
        ILogger<AttendedUserCleanupJob> logger)
    {
        _roomRepo = roomRepo;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;

        _logger.LogInformation("Starting attended user cleanup job (threshold: {Threshold})", StaleThreshold);

        // Query rooms with non-empty AttendedUserIds
        // In a multi-replica setup, SignalR disconnect may not fire for all replicas.
        // This job clears stale attendance data persisted in Cosmos.
        List<ChatRoom> roomsWithAttendees = await _roomRepo.GetRoomsWithAttendeesAsync(ct);

        int cleaned = 0;

        // The stale threshold is based on last message timestamp as a proxy for activity.
        // Rooms where the last update was > 15 minutes ago with non-empty attendance are stale.
        long staleBeforeTimestamp = DateTimeOffset.UtcNow.Add(-StaleThreshold).ToUnixTimeMilliseconds();

        foreach (ChatRoom room in roomsWithAttendees)
        {
            // Use the later of lastMessageTimestamp or updatedTimestamp as activity indicator
            long lastActivity = Math.Max(
                room.LastMessageTimestamp ?? 0,
                room.UpdatedTimestamp ?? 0);

            if (lastActivity > 0 && lastActivity < staleBeforeTimestamp)
            {
                _logger.LogInformation(
                    "Clearing stale attendance for room {RoomId} ({Count} users, last activity {Last})",
                    room.Id, room.AttendedUserIds.Count, lastActivity);

                room.AttendedUserIds.Clear();

                try
                {
                    await _roomRepo.UpdateAsync(room, ct);
                    cleaned++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error clearing attendance for room {RoomId}", room.Id);
                }
            }
        }

        _logger.LogInformation("Attended user cleanup job completed: {Cleaned} rooms cleaned", cleaned);
    }
}

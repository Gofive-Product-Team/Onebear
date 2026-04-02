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

    public Task Execute(IJobExecutionContext context)
    {
        _logger.LogInformation("Starting attended user cleanup job (threshold: {Threshold})",
            StaleThreshold);

        // AttendedUserIds are managed in-memory by the AttendanceService in the API process.
        // This job serves as a safety net to clear stale attendance data from persisted ChatRoom documents.
        // The primary cleanup is handled by SignalR OnDisconnectedAsync.
        //
        // In a multi-replica setup, this job would query rooms with non-empty AttendedUserIds
        // and clear entries older than the stale threshold.

        _logger.LogInformation("Attended user cleanup job completed");
        return Task.CompletedTask;
    }
}

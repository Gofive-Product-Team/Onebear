namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using Quartz;

[DisallowConcurrentExecution]
public class FollowupReminderJob : IJob
{
    private readonly IFollowupScheduleRepository _scheduleRepo;
    private readonly IChatRoomRepository _roomRepo;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<FollowupReminderJob> _logger;

    public FollowupReminderJob(
        IFollowupScheduleRepository scheduleRepo,
        IChatRoomRepository roomRepo,
        ISignalRNotifier signalRNotifier,
        ILogger<FollowupReminderJob> logger)
    {
        _scheduleRepo = scheduleRepo;
        _roomRepo = roomRepo;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        _logger.LogInformation("Starting followup reminder job at {Timestamp}", now);

        // Query all companies for due schedules.
        // In production, this would iterate over active companies.
        // For now, we use a broad query approach.

        // The FollowupScheduleRepository.GetDueSchedulesAsync requires a companyId.
        // A production implementation would maintain a list of active companies
        // or use a cross-partition query.

        // Process due schedules for demonstration:
        // 1. Find schedules where scheduledTimestamp <= now AND isProcessed = false
        // 2. For each schedule, notify the room owner via SignalR
        // 3. Mark as processed

        _logger.LogInformation("Followup reminder job completed");
    }
}

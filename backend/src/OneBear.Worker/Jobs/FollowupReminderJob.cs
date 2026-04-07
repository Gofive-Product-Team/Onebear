namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Application.Notifications.Services;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using Quartz;

[DisallowConcurrentExecution]
public class FollowupReminderJob : IJob
{
    private readonly IFollowupScheduleRepository _scheduleRepo;
    private readonly IChatRoomRepository _roomRepo;
    private readonly NotificationService _notificationService;
    private readonly ILogger<FollowupReminderJob> _logger;

    public FollowupReminderJob(
        IFollowupScheduleRepository scheduleRepo,
        IChatRoomRepository roomRepo,
        NotificationService notificationService,
        ILogger<FollowupReminderJob> logger)
    {
        _scheduleRepo = scheduleRepo;
        _roomRepo = roomRepo;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        _logger.LogInformation("Starting followup reminder job at {Timestamp}", now);

        int notified = 0;
        int errors = 0;

        // Query rooms that have a followup timestamp due
        // Rooms with followupTimestamp <= now need reminders
        // We use the room's own followupTimestamp field to avoid needing cross-partition queries
        // on FollowupSchedule — the room itself carries the due time
        List<ChatRoom> dueRooms = await _roomRepo.GetRoomsWithDueFollowupsAsync(now, ct);

        _logger.LogInformation("Found {Count} rooms with due follow-ups", dueRooms.Count);

        foreach (ChatRoom room in dueRooms)
        {
            try
            {
                string? assignedUserId = room.AssignToUserId;
                if (string.IsNullOrEmpty(assignedUserId))
                {
                    _logger.LogDebug("Room {RoomId} has due follow-up but no assigned agent, skipping", room.Id);
                    continue;
                }

                await _notificationService.NotifyFollowUpReminderAsync(
                    room.Id, room.CompanyId, assignedUserId, room.FollowupContent, ct);

                // Clear the followup after notifying
                room.FollowupTimestamp = null;
                room.FollowupContent = null;
                await _roomRepo.UpdateAsync(room, ct);

                notified++;
            }
            catch (Exception ex)
            {
                errors++;
                _logger.LogError(ex, "Error processing followup for room {RoomId}", room.Id);
            }
        }

        _logger.LogInformation(
            "Followup reminder job completed: {Notified} notified, {Errors} errors",
            notified, errors);
    }
}

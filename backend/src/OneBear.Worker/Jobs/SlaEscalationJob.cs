namespace OneBear.Worker.Jobs;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;
using Quartz;

[DisallowConcurrentExecution]
public class SlaEscalationJob : IJob
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly ICompanyFeatureSettingsRepository _settingsRepo;
    private readonly ILogger<SlaEscalationJob> _logger;

    public SlaEscalationJob(
        IChatRoomRepository roomRepo,
        ICompanyFeatureSettingsRepository settingsRepo,
        ILogger<SlaEscalationJob> logger)
    {
        _roomRepo = roomRepo;
        _settingsRepo = settingsRepo;
        _logger = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        CancellationToken ct = context.CancellationToken;
        long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        _logger.LogInformation("Starting SLA escalation job at {Timestamp}", nowMs);

        int level1Count = 0;
        int level2Count = 0;
        int level3Count = 0;
        int errors = 0;

        List<ChatRoom> rooms = await _roomRepo.GetRoomsForSlaCheckAsync(ct);

        _logger.LogInformation("Found {Count} rooms eligible for SLA check", rooms.Count);

        // Group rooms by company to batch settings lookups
        Dictionary<string, CompanyFeatureSettings?> settingsCache = new();

        foreach (ChatRoom room in rooms)
        {
            try
            {
                if (!room.FrtStartTimestamp.HasValue)
                    continue;

                // Fetch company SLA settings (cached per company)
                if (!settingsCache.TryGetValue(room.CompanyId, out CompanyFeatureSettings? settings))
                {
                    settings = await _settingsRepo.GetByCompanyIdAsync(room.CompanyId, ct);
                    settingsCache[room.CompanyId] = settings;
                }

                int level1Minutes = settings?.SlaLevel1Minutes ?? 15;
                int level2Minutes = settings?.SlaLevel2Minutes ?? 30;
                int level3Minutes = settings?.SlaLevel3Minutes ?? 60;

                long elapsedMs = nowMs - room.FrtStartTimestamp.Value;
                double elapsedMinutes = elapsedMs / 60_000.0;

                if (elapsedMinutes >= level3Minutes)
                {
                    level3Count++;
                    _logger.LogWarning(
                        "SLA Level 3 breach for room {RoomId} (company {CompanyId}): elapsed {Elapsed:F1} min >= {Threshold} min",
                        room.Id, room.CompanyId, elapsedMinutes, level3Minutes);

                    // Add "Urgent" tag if not already present
                    bool hasUrgent = room.Tags.Any(t => t.Name == "Urgent");
                    if (!hasUrgent)
                    {
                        room.Tags.Add(new RoomTag
                        {
                            Id = "urgent",
                            Name = "Urgent",
                            Color = "#FF0000"
                        });
                        await _roomRepo.UpdateAsync(room, ct);
                    }
                }
                else if (elapsedMinutes >= level2Minutes)
                {
                    level2Count++;
                    _logger.LogWarning(
                        "SLA Level 2 breach for room {RoomId} (company {CompanyId}): elapsed {Elapsed:F1} min >= {Threshold} min",
                        room.Id, room.CompanyId, elapsedMinutes, level2Minutes);
                }
                else if (elapsedMinutes >= level1Minutes)
                {
                    level1Count++;
                    _logger.LogWarning(
                        "SLA Level 1 breach for room {RoomId} (company {CompanyId}): elapsed {Elapsed:F1} min >= {Threshold} min",
                        room.Id, room.CompanyId, elapsedMinutes, level1Minutes);
                }
            }
            catch (Exception ex)
            {
                errors++;
                _logger.LogError(ex, "Error processing SLA check for room {RoomId}", room.Id);
            }
        }

        _logger.LogInformation(
            "SLA escalation job completed: Level1={L1}, Level2={L2}, Level3={L3}, Errors={Errors}",
            level1Count, level2Count, level3Count, errors);
    }
}

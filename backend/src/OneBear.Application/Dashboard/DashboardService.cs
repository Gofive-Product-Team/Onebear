namespace OneBear.Application.Dashboard;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class DashboardService
{
    private readonly IDashboardRepository _repo;

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    public async Task<DashboardResponse> GetDashboardAsync(
        string companyId, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        long fromMs = from.ToUnixTimeMilliseconds();
        long toMs = to.ToUnixTimeMilliseconds();

        // 1. Stats
        long totalRooms = await _repo.CountRoomsByCompanyAsync(companyId, ct);
        long activeRooms = await _repo.CountActiveRoomsByCompanyAsync(companyId, ct);

        long todayStart = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero).ToUnixTimeMilliseconds();
        long resolvedToday = await _repo.CountResolvedRoomsSinceAsync(companyId, todayStart, ct);

        List<RoomFrtProjection> frtRooms = await _repo.GetFrtRoomsAsync(companyId, fromMs, toMs, ct);
        long avgResponseTimeMs = frtRooms.Count > 0
            ? (long)frtRooms.Where(r => r.FrtDurationMs.HasValue).Average(r => r.FrtDurationMs!.Value)
            : 0;

        DashboardStatsDto stats = new()
        {
            TotalRooms = (int)totalRooms,
            ActiveRooms = (int)activeRooms,
            ResolvedToday = (int)resolvedToday,
            AvgResponseTimeMs = avgResponseTimeMs,
            TotalRoomsChange = 0,
            ActiveRoomsChange = 0,
            ResolvedTodayChange = 0,
            AvgResponseTimeMsChange = 0,
        };

        // 2. Platform Distribution
        List<PlatformCountProjection> platformAgg = await _repo.GetPlatformDistributionAsync(companyId, ct);
        List<PlatformDistributionDto> platformDistribution = platformAgg
            .Select(p => new PlatformDistributionDto { Platform = p.Platform, Count = p.Count })
            .OrderByDescending(p => p.Count)
            .ToList();

        // 3. Message Volume (group by day)
        List<MessageProjection> allMessages = await _repo.GetMessagesInRangeAsync(companyId, fromMs, toMs, ct);

        List<MessageVolumeDto> messagesByDay = allMessages
            .GroupBy(m => DateTimeOffset.FromUnixTimeMilliseconds(m.Timestamp).UtcDateTime.Date)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                // Inbound = messages from customers (not AI, not agent-like userId)
                // Heuristic: if UserId contains '-' and length > 30 => agent (Keycloak UUID)
                int inbound = g.Count(m => !m.IsAiMessage && !(m.UserId?.Contains('-') == true && m.UserId.Length > 30));
                int outbound = g.Count() - inbound;
                return new MessageVolumeDto
                {
                    Date = g.Key.ToString("MMM dd"),
                    Inbound = inbound,
                    Outbound = outbound
                };
            })
            .ToList();

        // 4. Response Time Trend (avg FRT per day)
        List<ResponseTimeTrendDto> responseTimeTrend = frtRooms
            .Where(r => r.FrtEndTimestamp.HasValue && r.FrtDurationMs.HasValue)
            .GroupBy(r => DateTimeOffset.FromUnixTimeMilliseconds(r.FrtEndTimestamp!.Value).UtcDateTime.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ResponseTimeTrendDto
            {
                Date = g.Key.ToString("MMM dd"),
                AvgMs = (long)g.Average(r => r.FrtDurationMs!.Value)
            })
            .ToList();

        // 5. Agent Performance
        List<AssignedRoomProjection> assignedRooms = await _repo.GetAssignedRoomsAsync(companyId, fromMs, ct);

        var agentGroups = assignedRooms
            .Where(r => r.AssignToUserId != null)
            .GroupBy(r => r.AssignToUserId!)
            .ToList();

        // Lookup agent names from UserProfiles
        List<string> agentIds = agentGroups.Select(g => g.Key).ToList();
        List<UserProfile> profiles = agentIds.Count > 0
            ? await _repo.GetUserProfilesByIdsAsync(agentIds, ct)
            : new();

        Dictionary<string, string> profileMap = profiles.ToDictionary(
            p => p.KeycloakUserId ?? p.Id,
            p => p.DisplayName ?? p.Email);

        List<AgentPerformanceDto> agentPerformance = agentGroups
            .Select(g => new AgentPerformanceDto
            {
                UserId = g.Key,
                Name = profileMap.GetValueOrDefault(g.Key, g.Key),
                RoomsHandled = g.Count(),
                AvgResponseTimeMs = g.Any(r => r.FrtDurationMs.HasValue)
                    ? (long)g.Where(r => r.FrtDurationMs.HasValue).Average(r => r.FrtDurationMs!.Value)
                    : 0,
                Satisfaction = 0 // No satisfaction data yet
            })
            .OrderByDescending(a => a.RoomsHandled)
            .Take(10)
            .ToList();

        return new DashboardResponse
        {
            Stats = stats,
            PlatformDistribution = platformDistribution,
            MessageVolume = messagesByDay,
            ResponseTimeTrend = responseTimeTrend,
            AgentPerformance = agentPerformance,
        };
    }
}

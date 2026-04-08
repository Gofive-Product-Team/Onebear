namespace OneBear.Application.Dashboard;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class DashboardService
{
    private readonly IDashboardRepository _repo;
    private readonly IOrderRepository _orderRepo;

    public DashboardService(IDashboardRepository repo, IOrderRepository orderRepo)
    {
        _repo = repo;
        _orderRepo = orderRepo;
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

        // 6. Order KPIs
        long todayEndMs = todayStart + 86_400_000;
        decimal todayRevenue = await _orderRepo.GetRevenueAsync(companyId, todayStart, todayEndMs, ct);
        decimal periodRevenue = await _orderRepo.GetRevenueAsync(companyId, fromMs, toMs, ct);
        int newOrders = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.New, ct);
        int paidOrders = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.Completed, ct);
        int pendingPayment = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.PendingPayment, ct);
        int pendingVerify = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.PendingVerify, ct);

        // AI closure rate (count orders with AiClosed = true among completed)
        // For now approximate: just count completed orders
        OrderKpiDto orderKpi = new()
        {
            TodayRevenue = todayRevenue,
            PeriodRevenue = periodRevenue,
            NewOrders = newOrders,
            PaidOrders = paidOrders,
            PendingPayment = pendingPayment,
            PendingVerify = pendingVerify,
            AvgOrderValue = paidOrders > 0 ? periodRevenue / paidOrders : 0,
            AiClosedOrders = 0, // TODO: query ai_closed flag when needed
            AiClosureRate = 0,
        };

        // 7. Calendar Heatmap (daily revenue for the period)
        List<CalendarHeatmapDto> calendarHeatmap = new();
        DateTimeOffset cursor = from.Date == default ? DateTimeOffset.UtcNow.AddDays(-30) : from;
        DateTimeOffset end = to;
        while (cursor.Date <= end.Date)
        {
            long dayStart = new DateTimeOffset(cursor.Date, TimeSpan.Zero).ToUnixTimeMilliseconds();
            long dayEnd = dayStart + 86_400_000;
            decimal dayRevenue = await _orderRepo.GetRevenueAsync(companyId, dayStart, dayEnd, ct);
            calendarHeatmap.Add(new CalendarHeatmapDto
            {
                Date = cursor.Date.ToString("yyyy-MM-dd"),
                Revenue = dayRevenue,
                OrderCount = 0, // lightweight — skip per-day count for now
            });
            cursor = cursor.AddDays(1);
        }

        return new DashboardResponse
        {
            Stats = stats,
            OrderKpi = orderKpi,
            PlatformDistribution = platformDistribution,
            MessageVolume = messagesByDay,
            ResponseTimeTrend = responseTimeTrend,
            AgentPerformance = agentPerformance,
            CalendarHeatmap = calendarHeatmap,
        };
    }
}

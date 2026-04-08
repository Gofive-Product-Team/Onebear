namespace OneBear.Application.Insights.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Insights.DTOs;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class InsightsService
{
    private readonly IOrderRepository _orderRepo;
    private readonly ICustomerRepository _customerRepo;
    private readonly IDashboardRepository _dashboardRepo;
    private readonly ILogger<InsightsService> _logger;

    public InsightsService(
        IOrderRepository orderRepo,
        ICustomerRepository customerRepo,
        IDashboardRepository dashboardRepo,
        ILogger<InsightsService> logger)
    {
        _orderRepo = orderRepo;
        _customerRepo = customerRepo;
        _dashboardRepo = dashboardRepo;
        _logger = logger;
    }

    public async Task<DailyInsightsResponse> GenerateDailyInsightsAsync(
        string companyId, DateTimeOffset date, CancellationToken ct)
    {
        long dayStart = new DateTimeOffset(date.Date, TimeSpan.Zero).ToUnixTimeMilliseconds();
        long dayEnd = dayStart + 86_400_000;

        // 7-day average for comparison
        long weekAgo = dayStart - (7 * 86_400_000);

        // Sales
        decimal todayRevenue = await _orderRepo.GetRevenueAsync(companyId, dayStart, dayEnd, ct);
        decimal weekRevenue = await _orderRepo.GetRevenueAsync(companyId, weekAgo, dayStart, ct);
        decimal avgRevenue = weekRevenue / 7;
        double salesChange = avgRevenue > 0 ? (double)((todayRevenue - avgRevenue) / avgRevenue * 100) : 0;

        int completedOrders = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.Completed, ct);
        decimal avgOrderValue = completedOrders > 0 ? todayRevenue / completedOrders : 0;

        // Customers
        int newThisWeek = await _customerRepo.GetNewThisWeekCountAsync(companyId, ct);
        Domain.Common.CustomerSegmentCounts segments = await _customerRepo.GetSegmentCountsAsync(companyId, ct);

        // Chat
        long activeRooms = await _dashboardRepo.CountActiveRoomsByCompanyAsync(companyId, ct);
        long resolvedToday = await _dashboardRepo.CountResolvedRoomsSinceAsync(companyId, dayStart, ct);

        List<RoomFrtProjection> frtRooms = await _dashboardRepo.GetFrtRoomsAsync(companyId, dayStart, dayEnd, ct);
        long avgResponseTimeMs = frtRooms.Count > 0
            ? (long)frtRooms.Where(r => r.FrtDurationMs.HasValue).DefaultIfEmpty(new RoomFrtProjection()).Average(r => r.FrtDurationMs ?? 0)
            : 0;

        // Generate recommendations
        List<ActionRecommendation> recommendations = GenerateRecommendations(
            todayRevenue, avgRevenue, salesChange, segments, avgResponseTimeMs);

        return new DailyInsightsResponse
        {
            Date = date.Date.ToString("yyyy-MM-dd"),
            Sales = new SalesInsight
            {
                Revenue = todayRevenue,
                AvgRevenue = Math.Round(avgRevenue, 2),
                ChangePercent = Math.Round(salesChange, 1),
                OrderCount = completedOrders,
                AvgOrderValue = Math.Round(avgOrderValue, 2),
            },
            Customers = new CustomerInsight
            {
                NewCustomers = newThisWeek,
                AvgNewCustomers = newThisWeek, // simplified
                AtRiskCount = segments.AtRisk,
                HotCount = segments.Hot,
            },
            Chat = new ChatInsight
            {
                ActiveRooms = (int)activeRooms,
                AvgResponseTimeMs = avgResponseTimeMs,
                TotalMessages = 0, // would need message count query
                UnansweredCount = 0,
            },
            Ai = new AiInsight(), // populated when AI activity data grows
            Recommendations = recommendations,
        };
    }

    private static List<ActionRecommendation> GenerateRecommendations(
        decimal revenue, decimal avgRevenue, double changePercent,
        Domain.Common.CustomerSegmentCounts segments, long avgResponseTimeMs)
    {
        List<ActionRecommendation> recs = new();

        // Revenue trend
        if (changePercent > 20)
        {
            recs.Add(new ActionRecommendation
            {
                Category = "sales", Priority = "low",
                Title = "Revenue above average",
                Description = $"Revenue is {changePercent:F0}% above your 7-day average. Keep up the momentum!",
            });
        }
        else if (changePercent < -20)
        {
            recs.Add(new ActionRecommendation
            {
                Category = "sales", Priority = "high",
                Title = "Revenue below average",
                Description = $"Revenue dropped {Math.Abs(changePercent):F0}% below average. Consider running a promotion or follow-up campaign.",
                ActionUrl = "/orders",
            });
        }

        // At-risk customers
        if (segments.AtRisk > 5)
        {
            recs.Add(new ActionRecommendation
            {
                Category = "customer", Priority = "high",
                Title = $"{segments.AtRisk} at-risk customers",
                Description = "These customers haven't purchased recently. Send follow-ups to re-engage.",
                ActionUrl = "/customer?segment=At-risk",
            });
        }

        // Hot customers
        if (segments.Hot > 0)
        {
            recs.Add(new ActionRecommendation
            {
                Category = "customer", Priority = "medium",
                Title = $"{segments.Hot} hot customers active",
                Description = "Prioritize these customers — they're ready to buy.",
                ActionUrl = "/customer?segment=Hot",
            });
        }

        // Response time
        if (avgResponseTimeMs > 900_000) // > 15 min
        {
            recs.Add(new ActionRecommendation
            {
                Category = "chat", Priority = "high",
                Title = "Response time above SLA",
                Description = $"Average response time is {avgResponseTimeMs / 60000}m. Target is under 15 minutes.",
                ActionUrl = "/chat",
            });
        }

        return recs;
    }
}

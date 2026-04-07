namespace OneBear.Application.Dashboard;

public class DashboardResponse
{
    public DashboardStatsDto Stats { get; set; } = new();
    public List<PlatformDistributionDto> PlatformDistribution { get; set; } = new();
    public List<MessageVolumeDto> MessageVolume { get; set; } = new();
    public List<ResponseTimeTrendDto> ResponseTimeTrend { get; set; } = new();
    public List<AgentPerformanceDto> AgentPerformance { get; set; } = new();
}

public class DashboardStatsDto
{
    public int TotalRooms { get; set; }
    public int ActiveRooms { get; set; }
    public int ResolvedToday { get; set; }
    public long AvgResponseTimeMs { get; set; }
    public double TotalRoomsChange { get; set; }
    public double ActiveRoomsChange { get; set; }
    public double ResolvedTodayChange { get; set; }
    public double AvgResponseTimeMsChange { get; set; }
}

public class PlatformDistributionDto
{
    public string Platform { get; set; } = "";
    public int Count { get; set; }
}

public class MessageVolumeDto
{
    public string Date { get; set; } = "";
    public int Inbound { get; set; }
    public int Outbound { get; set; }
}

public class ResponseTimeTrendDto
{
    public string Date { get; set; } = "";
    public long AvgMs { get; set; }
}

public class AgentPerformanceDto
{
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
    public int RoomsHandled { get; set; }
    public long AvgResponseTimeMs { get; set; }
    public double Satisfaction { get; set; }
}

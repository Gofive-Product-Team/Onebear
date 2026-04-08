namespace OneBear.Application.Insights.DTOs;

public record DailyInsightsResponse
{
    public string Date { get; init; } = default!; // "2026-04-08"
    public SalesInsight Sales { get; init; } = new();
    public CustomerInsight Customers { get; init; } = new();
    public ChatInsight Chat { get; init; } = new();
    public AiInsight Ai { get; init; } = new();
    public List<ActionRecommendation> Recommendations { get; init; } = new();
}

public record SalesInsight
{
    public decimal Revenue { get; init; }
    public decimal AvgRevenue { get; init; }
    public double ChangePercent { get; init; }
    public int OrderCount { get; init; }
    public decimal AvgOrderValue { get; init; }
    public List<ChannelRevenue> ChannelBreakdown { get; init; } = new();
}

public record ChannelRevenue
{
    public string Channel { get; init; } = default!;
    public decimal Revenue { get; init; }
    public double Percent { get; init; }
    public string Trend { get; init; } = "stable"; // "up" | "down" | "stable"
}

public record CustomerInsight
{
    public int NewCustomers { get; init; }
    public int AvgNewCustomers { get; init; }
    public double ConversionRate { get; init; }
    public int AtRiskCount { get; init; }
    public int HotCount { get; init; }
}

public record ChatInsight
{
    public int TotalMessages { get; init; }
    public int ActiveRooms { get; init; }
    public long AvgResponseTimeMs { get; init; }
    public double SlaComplianceRate { get; init; } // % answered within 15 min
    public int UnansweredCount { get; init; }
}

public record AiInsight
{
    public int AiMessagesHandled { get; init; }
    public int AiOrdersClosed { get; init; }
    public int HandoffCount { get; init; }
    public double AiConfidenceAvg { get; init; }
}

public record ActionRecommendation
{
    public string Category { get; init; } = default!; // "sales" | "customer" | "chat" | "ai"
    public string Priority { get; init; } = "medium"; // "high" | "medium" | "low"
    public string Title { get; init; } = default!;
    public string Description { get; init; } = default!;
    public string? ActionUrl { get; init; }
}

namespace OneBear.Application.Customers.DTOs;

public record CustomerKpiSnapshotDto
{
    public int TotalCustomers { get; init; }
    public int AtRiskCount { get; init; }
    public int HotCount { get; init; }
    public int NewThisWeek { get; init; }
    public decimal TotalLtv { get; init; }
    public string? AlertMessage { get; init; }
}

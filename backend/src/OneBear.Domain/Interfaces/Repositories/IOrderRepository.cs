namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<Order?> GetByOrderIdAsync(string orderId, string companyId, CancellationToken ct = default);
    Task<(List<Order> Items, string? ContinuationToken)> QueryAsync(string companyId, OrderQueryParams query, CancellationToken ct = default);
    Task<Order> CreateAsync(Order order, CancellationToken ct = default);
    Task<Order> UpdateAsync(Order order, CancellationToken ct = default);
    Task<int> GetNextSequenceAsync(string companyId, CancellationToken ct = default);
    Task<List<Order>> GetExpiredSoftHoldsAsync(long nowTimestamp, CancellationToken ct = default);
    Task<List<Order>> GetExpiredPaymentLinksAsync(long nowTimestamp, CancellationToken ct = default);
    Task<decimal> GetRevenueAsync(string companyId, long fromTimestamp, long toTimestamp, CancellationToken ct = default);
    Task<int> GetCountByStatusAsync(string companyId, string status, CancellationToken ct = default);
}

public class OrderQueryParams
{
    public string? Status { get; set; }
    public string? CustomerId { get; set; }
    public string? AssignedToUserId { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; } // "newest", "oldest", "total", "status"
    public int PageSize { get; set; } = 20;
    public string? ContinuationToken { get; set; }
}

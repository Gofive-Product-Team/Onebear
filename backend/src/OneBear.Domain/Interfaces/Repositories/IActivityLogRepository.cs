namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IActivityLogRepository
{
    Task<ActivityLog> CreateAsync(ActivityLog log, CancellationToken ct = default);

    Task<(List<ActivityLog> Items, string? ContinuationToken)> GetByCustomerAsync(
        string customerId,
        string? type,
        int pageSize,
        string? continuationToken,
        CancellationToken ct = default);
}

namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IIntegrationChannelRepository
{
    Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<IntegrationChannel> Items, string? ContinuationToken)> ListAsync(string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default);
    Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default);
}

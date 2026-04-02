namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IIntegrationChannelRepository
{
    Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default);
    Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default);
    Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default);
    Task DeleteAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<IntegrationChannel>> GetAllWithExpiringTokensAsync(long expiryThresholdTimestamp, CancellationToken ct = default);
}

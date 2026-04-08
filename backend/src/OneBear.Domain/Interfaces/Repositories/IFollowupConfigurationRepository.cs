namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IFollowupConfigurationRepository
{
    Task<FollowupConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<FollowupConfiguration> UpsertAsync(FollowupConfiguration config, CancellationToken ct = default);
}

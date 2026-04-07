namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface ICompanyFeatureSettingsRepository
{
    Task<CompanyFeatureSettings?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<CompanyFeatureSettings> UpsertAsync(CompanyFeatureSettings settings, CancellationToken ct = default);
}

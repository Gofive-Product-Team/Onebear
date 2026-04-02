namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class CompanyFeatureSettingsRepository : CosmosRepositoryBase<CompanyFeatureSettings>, ICompanyFeatureSettingsRepository
{
    public CompanyFeatureSettingsRepository(CosmosDbContext context, ILogger<CompanyFeatureSettingsRepository> logger)
        : base(context.CompanyFeatureSettings, logger) { }

    protected override string GetEntityId(CompanyFeatureSettings entity) => entity.Id;

    public async Task<CompanyFeatureSettings?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<CompanyFeatureSettings> items, _) = await QueryAsync<CompanyFeatureSettings>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<CompanyFeatureSettings> UpsertAsync(CompanyFeatureSettings settings, CancellationToken ct = default)
        => UpsertItemAsync(settings, new PartitionKey(settings.CompanyId), ct);
}

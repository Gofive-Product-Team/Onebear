namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class CompanyFeatureSettingsRepository : MongoRepositoryBase<CompanyFeatureSettings>, ICompanyFeatureSettingsRepository
{
    public CompanyFeatureSettingsRepository(MongoDbContext context, ILogger<CompanyFeatureSettingsRepository> logger)
        : base(context.CompanyFeatureSettings, logger) { }

    public async Task<CompanyFeatureSettings?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<CompanyFeatureSettings> filter = Builders<CompanyFeatureSettings>.Filter.Eq(c => c.CompanyId, companyId);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public Task<CompanyFeatureSettings> UpsertAsync(CompanyFeatureSettings settings, CancellationToken ct = default)
        => UpsertItemAsync(settings, ct);
}

namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class FollowupConfigurationRepository : MongoRepositoryBase<FollowupConfiguration>, IFollowupConfigurationRepository
{
    public FollowupConfigurationRepository(MongoDbContext context, ILogger<FollowupConfigurationRepository> logger)
        : base(context.FollowupConfigurations, logger) { }

    public async Task<FollowupConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<FollowupConfiguration> filter = Builders<FollowupConfiguration>.Filter.Eq(c => c.CompanyId, companyId);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public Task<FollowupConfiguration> UpsertAsync(FollowupConfiguration config, CancellationToken ct = default)
        => UpsertItemAsync(config, ct);
}

namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class IntegrationChannelRepository : MongoRepositoryBase<IntegrationChannel>, IIntegrationChannelRepository
{
    public IntegrationChannelRepository(MongoDbContext context, ILogger<IntegrationChannelRepository> logger)
        : base(context.IntegrationChannels, logger) { }

    public Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<IntegrationChannel> filter = Builders<IntegrationChannel>.Filter.Eq(c => c.CompanyId, companyId);
        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    public async Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<IntegrationChannel> fb = Builders<IntegrationChannel>.Filter;
        FilterDefinition<IntegrationChannel> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.Platform, platform)
        );

        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => CreateItemAsync(channel, ct);

    public Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => ReplaceItemAsync(channel, ct);

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => DeleteItemAsync(id, ct);

    public async Task<List<IntegrationChannel>> GetAllWithExpiringTokensAsync(
        long expiryThresholdTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<IntegrationChannel> fb = Builders<IntegrationChannel>.Filter;
        FilterDefinition<IntegrationChannel> filter = fb.And(
            fb.Eq(c => c.IsActive, true),
            fb.Ne("credentials.tokenExpiresAt", BsonNull.Value),
            fb.Lte("credentials.tokenExpiresAt", expiryThresholdTimestamp)
        );

        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    public async Task<IntegrationChannel?> GetByBotIdAsync(string platform, string botId, CancellationToken ct = default)
    {
        // LINE bot_id is stored in credentials.platformAccountId
        FilterDefinition<IntegrationChannel> filter = Builders<IntegrationChannel>.Filter.And(
            Builders<IntegrationChannel>.Filter.Eq(c => c.Platform, platform),
            Builders<IntegrationChannel>.Filter.Eq(c => c.IsActive, true),
            Builders<IntegrationChannel>.Filter.Eq("credentials.platformAccountId", botId));
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }
}

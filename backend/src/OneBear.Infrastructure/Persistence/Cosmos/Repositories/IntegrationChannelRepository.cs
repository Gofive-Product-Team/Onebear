namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class IntegrationChannelRepository : CosmosRepositoryBase<IntegrationChannel>, IIntegrationChannelRepository
{
    public IntegrationChannelRepository(CosmosDbContext context, ILogger<IntegrationChannelRepository> logger)
        : base(context.IntegrationChannels, logger) { }

    protected override string GetEntityId(IntegrationChannel entity) => entity.Id;

    public Task<IntegrationChannel?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<IntegrationChannel>> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<IntegrationChannel> items, _) = await QueryAsync<IntegrationChannel>(
            query, new PartitionKey(companyId), 100, null, ct);
        return items;
    }

    public async Task<IntegrationChannel?> GetByPlatformAsync(string companyId, string platform, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.companyId = @companyId AND c.platform = @platform")
            .WithParameter("@companyId", companyId)
            .WithParameter("@platform", platform);

        (List<IntegrationChannel> items, _) = await QueryAsync<IntegrationChannel>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<IntegrationChannel> CreateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => CreateItemAsync(channel, new PartitionKey(channel.CompanyId), ct);

    public Task<IntegrationChannel> UpdateAsync(IntegrationChannel channel, CancellationToken ct = default)
        => ReplaceItemAsync(channel, new PartitionKey(channel.CompanyId), ct);

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => DeleteItemAsync(id, new PartitionKey(companyId), ct);

    public async Task<List<IntegrationChannel>> GetAllWithExpiringTokensAsync(
        long expiryThresholdTimestamp, CancellationToken ct = default)
    {
        // Cross-partition query for integrations with tokens expiring before the threshold
        QueryDefinition query = new QueryDefinition(
            "SELECT * FROM c WHERE c.isActive = true " +
            "AND IS_DEFINED(c.credentials.tokenExpiresAt) " +
            "AND c.credentials.tokenExpiresAt != null " +
            "AND c.credentials.tokenExpiresAt <= @threshold")
            .WithParameter("@threshold", expiryThresholdTimestamp);

        QueryRequestOptions options = new() { MaxItemCount = 100 };
        using FeedIterator<IntegrationChannel> iterator = _container.GetItemQueryIterator<IntegrationChannel>(
            query, requestOptions: options);

        List<IntegrationChannel> results = new();
        while (iterator.HasMoreResults)
        {
            FeedResponse<IntegrationChannel> response = await iterator.ReadNextAsync(ct);
            results.AddRange(response);
        }
        return results;
    }
}

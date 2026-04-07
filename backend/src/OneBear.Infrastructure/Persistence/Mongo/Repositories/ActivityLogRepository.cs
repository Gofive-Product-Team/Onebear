namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ActivityLogRepository : MongoRepositoryBase<ActivityLog>, IActivityLogRepository
{
    public ActivityLogRepository(MongoDbContext context, ILogger<ActivityLogRepository> logger)
        : base(context.ActivityLogs, logger) { }

    public Task<ActivityLog> CreateAsync(ActivityLog log, CancellationToken ct = default)
        => CreateItemAsync(log, ct);

    public async Task<(List<ActivityLog> Items, string? ContinuationToken)> GetByCustomerAsync(
        string customerId,
        string? type,
        int pageSize,
        string? continuationToken,
        CancellationToken ct = default)
    {
        FilterDefinitionBuilder<ActivityLog> fb = Builders<ActivityLog>.Filter;
        FilterDefinition<ActivityLog> filter = fb.Eq(a => a.CustomerId, customerId);

        if (!string.IsNullOrWhiteSpace(type))
        {
            filter = fb.And(filter, fb.Eq(a => a.Type, type));
        }

        SortDefinition<ActivityLog> sort = Builders<ActivityLog>.Sort.Descending(a => a.Timestamp);

        int skip = 0;
        if (!string.IsNullOrEmpty(continuationToken) && int.TryParse(continuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<ActivityLog> results = await _collection
            .Find(filter)
            .Sort(sort)
            .Skip(skip)
            .Limit(pageSize + 1)
            .ToListAsync(ct);

        bool hasMore = results.Count > pageSize;
        if (hasMore)
        {
            results.RemoveAt(results.Count - 1);
        }

        string? nextToken = hasMore ? (skip + pageSize).ToString() : null;
        return (results, nextToken);
    }
}

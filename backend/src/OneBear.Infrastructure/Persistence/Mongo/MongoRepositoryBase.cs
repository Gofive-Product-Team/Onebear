namespace OneBear.Infrastructure.Persistence.Mongo;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public abstract class MongoRepositoryBase<T> where T : MongoEntity
{
    protected readonly IMongoCollection<T> _collection;
    protected readonly ILogger _logger;

    protected MongoRepositoryBase(IMongoCollection<T> collection, ILogger logger)
    {
        _collection = collection;
        _logger = logger;
    }

    protected async Task<T?> ReadAsync(string id, CancellationToken ct)
    {
        FilterDefinition<T> filter = Builders<T>.Filter.Eq(e => e.Id, id);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    protected async Task<T> CreateItemAsync(T entity, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp ??= now;
        }

        entity.Version = 1;
        await _collection.InsertOneAsync(entity, cancellationToken: ct);
        return entity;
    }

    protected async Task<T> ReplaceItemAsync(T entity, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            auditable.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        long currentVersion = entity.Version;
        entity.Version = currentVersion + 1;

        FilterDefinition<T> filter = Builders<T>.Filter.And(
            Builders<T>.Filter.Eq(e => e.Id, entity.Id),
            Builders<T>.Filter.Eq(e => e.Version, currentVersion)
        );

        ReplaceOneResult result = await _collection.ReplaceOneAsync(filter, entity, cancellationToken: ct);

        if (result.ModifiedCount == 0)
        {
            entity.Version = currentVersion; // revert
            throw new ConcurrencyConflictException(
                $"Concurrency conflict on {typeof(T).Name} {entity.Id} (version {currentVersion})");
        }

        return entity;
    }

    protected async Task<T> ReplaceWithRetryAsync(
        T entity, Func<T, T> mutator, CancellationToken ct, int maxRetries = 3)
    {
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                return await ReplaceItemAsync(entity, ct);
            }
            catch (ConcurrencyConflictException)
            {
                if (attempt >= maxRetries - 1)
                    break;

                _logger.LogWarning("Version conflict on {Type} {Id}, retry {Attempt}/{Max}",
                    typeof(T).Name, entity.Id, attempt + 1, maxRetries);

                T? fresh = await ReadAsync(entity.Id, ct);
                if (fresh is null)
                    throw new ConcurrencyConflictException(
                        $"Entity {typeof(T).Name} {entity.Id} was deleted during retry");

                entity = mutator(fresh);
            }
        }

        throw new ConcurrencyConflictException(
            $"Failed to update {typeof(T).Name} {entity.Id} after {maxRetries} retries");
    }

    protected async Task<T> UpsertItemAsync(T entity, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp = now;
        }

        entity.Version += 1;

        FilterDefinition<T> filter = Builders<T>.Filter.Eq(e => e.Id, entity.Id);
        ReplaceOptions options = new() { IsUpsert = true };
        await _collection.ReplaceOneAsync(filter, entity, options, ct);
        return entity;
    }

    protected async Task DeleteItemAsync(string id, CancellationToken ct)
    {
        FilterDefinition<T> filter = Builders<T>.Filter.Eq(e => e.Id, id);
        await _collection.DeleteOneAsync(filter, ct);
    }

    protected async Task<(List<TResult> Items, string? ContinuationToken)> QueryPagedAsync<TResult>(
        FilterDefinition<TResult> filter,
        SortDefinition<TResult> sort,
        int pageSize,
        string? cursor,
        IMongoCollection<TResult> collection,
        CancellationToken ct)
    {
        IFindFluent<TResult, TResult> query = collection.Find(filter).Sort(sort).Limit(pageSize + 1);

        List<TResult> results = await query.ToListAsync(ct);

        bool hasMore = results.Count > pageSize;
        if (hasMore)
        {
            results.RemoveAt(results.Count - 1);
        }

        // For MongoDB, we use a simple page-number based continuation token
        // The cursor is an opaque string representing the current page offset
        string? nextToken = null;
        if (hasMore)
        {
            int currentOffset = 0;
            if (!string.IsNullOrEmpty(cursor) && int.TryParse(cursor, out int parsedOffset))
            {
                currentOffset = parsedOffset;
            }
            nextToken = (currentOffset + pageSize).ToString();
        }

        return (results, nextToken);
    }
}

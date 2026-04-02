namespace OneBear.Infrastructure.Persistence.Cosmos;

using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public abstract class CosmosRepositoryBase<T> where T : CosmosEntity
{
    protected readonly Container _container;
    protected readonly ILogger _logger;

    protected CosmosRepositoryBase(Container container, ILogger logger)
    {
        _container = container;
        _logger = logger;
    }

    protected async Task<T?> ReadAsync(string id, PartitionKey pk, CancellationToken ct)
    {
        try
        {
            ItemResponse<T> response = await _container.ReadItemAsync<T>(id, pk, cancellationToken: ct);
            T entity = response.Resource;
            entity.ETag = response.ETag;
            return entity;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    protected async Task<T> CreateItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp ??= now;
        }

        ItemResponse<T> response = await _container.CreateItemAsync(entity, pk, cancellationToken: ct);
        T created = response.Resource;
        created.ETag = response.ETag;
        return created;
    }

    protected async Task<T> ReplaceItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            auditable.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        }

        ItemRequestOptions options = new();
        if (entity.ETag is not null)
        {
            options.IfMatchEtag = entity.ETag;
        }

        ItemResponse<T> response = await _container.ReplaceItemAsync(entity, GetEntityId(entity), pk, options, ct);
        T replaced = response.Resource;
        replaced.ETag = response.ETag;
        return replaced;
    }

    protected async Task<T> ReplaceWithRetryAsync(
        T entity, PartitionKey pk, Func<T, T> mutator, CancellationToken ct, int maxRetries = 3)
    {
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                return await ReplaceItemAsync(entity, pk, ct);
            }
            catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.PreconditionFailed && attempt < maxRetries - 1)
            {
                _logger.LogWarning("ETag conflict on {Type} {Id}, retry {Attempt}/{Max}",
                    typeof(T).Name, GetEntityId(entity), attempt + 1, maxRetries);

                ItemResponse<T> fresh = await _container.ReadItemAsync<T>(
                    GetEntityId(entity), pk, cancellationToken: ct);
                entity = mutator(fresh.Resource);
                entity.ETag = fresh.ETag;
            }
        }

        throw new ConcurrencyConflictException(
            $"Failed to update {typeof(T).Name} {GetEntityId(entity)} after {maxRetries} retries");
    }

    protected async Task DeleteItemAsync(string id, PartitionKey pk, CancellationToken ct)
    {
        await _container.DeleteItemAsync<T>(id, pk, cancellationToken: ct);
    }

    protected async Task<T> UpsertItemAsync(T entity, PartitionKey pk, CancellationToken ct)
    {
        if (entity is IAuditableEntity auditable)
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            if (auditable.CreatedTimestamp == 0)
                auditable.CreatedTimestamp = now;
            auditable.UpdatedTimestamp = now;
        }

        ItemResponse<T> response = await _container.UpsertItemAsync(entity, pk, cancellationToken: ct);
        T result = response.Resource;
        result.ETag = response.ETag;
        return result;
    }

    protected async Task<(List<TResult> Items, string? ContinuationToken)> QueryAsync<TResult>(
        QueryDefinition query, PartitionKey pk, int pageSize, string? continuationToken, CancellationToken ct)
    {
        QueryRequestOptions options = new()
        {
            PartitionKey = pk,
            MaxItemCount = pageSize
        };

        using FeedIterator<TResult> iterator = _container.GetItemQueryIterator<TResult>(
            query, continuationToken, options);

        List<TResult> results = new();
        string? nextToken = null;

        if (iterator.HasMoreResults)
        {
            FeedResponse<TResult> response = await iterator.ReadNextAsync(ct);
            results.AddRange(response);
            nextToken = response.ContinuationToken;
        }

        return (results, nextToken);
    }

    protected abstract string GetEntityId(T entity);
}

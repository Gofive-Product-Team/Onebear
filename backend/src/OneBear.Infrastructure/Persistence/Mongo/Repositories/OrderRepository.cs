namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class OrderRepository : MongoRepositoryBase<Order>, IOrderRepository
{
    public OrderRepository(MongoDbContext context, ILogger<OrderRepository> logger)
        : base(context.Orders, logger) { }

    public async Task<Order?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.Id, id),
            fb.Eq(o => o.CompanyId, companyId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<Order?> GetByOrderIdAsync(string orderId, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.OrderId, orderId),
            fb.Eq(o => o.CompanyId, companyId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<(List<Order> Items, string? ContinuationToken)> QueryAsync(
        string companyId, OrderQueryParams query, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.Eq(o => o.CompanyId, companyId);

        if (!string.IsNullOrEmpty(query.Status))
            filter = fb.And(filter, fb.Eq(o => o.Status, query.Status));

        if (!string.IsNullOrEmpty(query.CustomerId))
            filter = fb.And(filter, fb.Eq(o => o.CustomerId, query.CustomerId));

        if (!string.IsNullOrEmpty(query.AssignedToUserId))
            filter = fb.And(filter, fb.Eq(o => o.AssignedToUserId, query.AssignedToUserId));

        if (!string.IsNullOrEmpty(query.Search))
        {
            BsonRegularExpression regex = new(query.Search, "i");
            FilterDefinition<Order> searchFilter = fb.Or(
                fb.Regex(o => o.OrderId, regex),
                fb.Regex(o => o.CustomerName, regex)
            );
            filter = fb.And(filter, searchFilter);
        }

        SortDefinition<Order> sort = query.Sort switch
        {
            "oldest" => Builders<Order>.Sort.Ascending(o => o.CreatedTimestamp),
            "total" => Builders<Order>.Sort.Descending(o => o.Total),
            "status" => Builders<Order>.Sort.Ascending(o => o.Status),
            _ => Builders<Order>.Sort.Descending(o => o.CreatedTimestamp) // "newest" default
        };

        int pageSize = query.PageSize > 0 ? query.PageSize : 20;
        int skip = 0;
        if (!string.IsNullOrEmpty(query.ContinuationToken) && int.TryParse(query.ContinuationToken, out int parsedOffset))
            skip = parsedOffset;

        List<Order> results = await _collection
            .Find(filter).Sort(sort).Skip(skip).Limit(pageSize + 1)
            .ToListAsync(ct);

        bool hasMore = results.Count > pageSize;
        if (hasMore) results.RemoveAt(results.Count - 1);

        string? nextToken = hasMore ? (skip + pageSize).ToString() : null;
        return (results, nextToken);
    }

    public Task<Order> CreateAsync(Order order, CancellationToken ct = default)
        => CreateItemAsync(order, ct);

    public Task<Order> UpdateAsync(Order order, CancellationToken ct = default)
        => ReplaceItemAsync(order, ct);

    public async Task<int> GetNextSequenceAsync(string companyId, CancellationToken ct = default)
    {
        long count = await _collection.CountDocumentsAsync(
            Builders<Order>.Filter.Eq(o => o.CompanyId, companyId), cancellationToken: ct);
        return (int)count + 1;
    }

    public async Task<List<Order>> GetExpiredSoftHoldsAsync(long nowTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.Status, OrderStatus.New),
            fb.Lt(o => o.SoftHoldExpiresAt, nowTimestamp),
            fb.Ne(o => o.SoftHoldExpiresAt, null),
            fb.Eq(o => o.StockDeducted, false)
        );
        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    public async Task<List<Order>> GetExpiredPaymentLinksAsync(long nowTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.Status, OrderStatus.PendingPayment),
            fb.Lt("paymentLink.expiresAtTimestamp", nowTimestamp)
        );
        return await _collection.Find(filter).Limit(100).ToListAsync(ct);
    }

    public async Task<decimal> GetRevenueAsync(string companyId, long fromTimestamp, long toTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.CompanyId, companyId),
            fb.Eq(o => o.Status, OrderStatus.Completed),
            fb.Gte(o => o.PaidTimestamp, fromTimestamp),
            fb.Lte(o => o.PaidTimestamp, toTimestamp)
        );
        List<Order> orders = await _collection.Find(filter).ToListAsync(ct);
        return orders.Sum(o => o.Total);
    }

    public async Task<int> GetCountByStatusAsync(string companyId, string status, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Order> fb = Builders<Order>.Filter;
        FilterDefinition<Order> filter = fb.And(
            fb.Eq(o => o.CompanyId, companyId),
            fb.Eq(o => o.Status, status)
        );
        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }
}

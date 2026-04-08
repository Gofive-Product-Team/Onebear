namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ProductRepository : MongoRepositoryBase<Product>, IProductRepository
{
    public ProductRepository(MongoDbContext context, ILogger<ProductRepository> logger)
        : base(context.Products, logger) { }

    public async Task<Product?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Product> fb = Builders<Product>.Filter;
        FilterDefinition<Product> filter = fb.And(
            fb.Eq(p => p.Id, id),
            fb.Eq(p => p.CompanyId, companyId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<(List<Product> Items, string? ContinuationToken)> QueryAsync(
        string companyId, ProductQueryParams query, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Product> fb = Builders<Product>.Filter;
        FilterDefinition<Product> filter = fb.Eq(p => p.CompanyId, companyId);

        if (!string.IsNullOrEmpty(query.Category))
        {
            filter = fb.And(filter, fb.Eq(p => p.Category, query.Category));
        }

        if (!string.IsNullOrEmpty(query.Status))
        {
            filter = fb.And(filter, fb.Eq(p => p.Status, query.Status));
        }

        if (!string.IsNullOrEmpty(query.Search))
        {
            BsonRegularExpression regex = new(query.Search, "i");
            filter = fb.And(filter, fb.Regex(p => p.Name, regex));
        }

        SortDefinition<Product> sort = query.Sort switch
        {
            "name" => Builders<Product>.Sort.Ascending(p => p.Name),
            "price" => Builders<Product>.Sort.Descending(p => p.Price),
            "stock" => Builders<Product>.Sort.Ascending(p => p.Stock),
            "newest" => Builders<Product>.Sort.Descending(p => p.CreatedTimestamp),
            _ => Builders<Product>.Sort.Descending(p => p.CreatedTimestamp)
        };

        int pageSize = query.PageSize > 0 ? query.PageSize : 20;
        int skip = 0;
        if (!string.IsNullOrEmpty(query.ContinuationToken) && int.TryParse(query.ContinuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<Product> results = await _collection
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

    public Task<Product> CreateAsync(Product product, CancellationToken ct = default)
        => CreateItemAsync(product, ct);

    public Task<Product> UpdateAsync(Product product, CancellationToken ct = default)
        => ReplaceItemAsync(product, ct);

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => DeleteItemAsync(id, ct);

    public async Task<List<Product>> GetByCategoryAsync(string companyId, string category, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Product> fb = Builders<Product>.Filter;
        FilterDefinition<Product> filter = fb.And(
            fb.Eq(p => p.CompanyId, companyId),
            fb.Eq(p => p.Category, category)
        );
        return await _collection.Find(filter).ToListAsync(ct);
    }

    public async Task<List<string>> GetDistinctCategoriesAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<Product> filter = Builders<Product>.Filter.Eq(p => p.CompanyId, companyId);
        IAsyncCursor<string> cursor = await _collection.DistinctAsync(p => p.Category, filter, cancellationToken: ct);
        return await cursor.ToListAsync(ct);
    }

    public async Task<Product?> GetByNameAsync(string companyId, string name, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Product> fb = Builders<Product>.Filter;
        BsonRegularExpression regex = new($"^{System.Text.RegularExpressions.Regex.Escape(name)}$", "i");
        FilterDefinition<Product> filter = fb.And(
            fb.Eq(p => p.CompanyId, companyId),
            fb.Regex(p => p.Name, regex)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<Product>> GetByIdsAsync(string companyId, List<string> ids, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Product> fb = Builders<Product>.Filter;
        FilterDefinition<Product> filter = fb.And(
            fb.Eq(p => p.CompanyId, companyId),
            fb.In(p => p.Id, ids)
        );
        return await _collection.Find(filter).ToListAsync(ct);
    }

    public async Task<int> GetCountAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<Product> filter = Builders<Product>.Filter.Eq(p => p.CompanyId, companyId);
        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }

    public async Task CreateManyAsync(List<Product> products, CancellationToken ct = default)
    {
        if (products.Count == 0) return;

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        foreach (Product product in products)
        {
            if (product.CreatedTimestamp == 0) product.CreatedTimestamp = now;
            product.UpdatedTimestamp ??= now;
            product.Version = 1;
        }

        await _collection.InsertManyAsync(products, cancellationToken: ct);
    }
}

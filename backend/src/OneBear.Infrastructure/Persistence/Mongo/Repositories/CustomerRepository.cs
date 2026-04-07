namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class CustomerRepository : MongoRepositoryBase<Customer>, ICustomerRepository
{
    public CustomerRepository(MongoDbContext context, ILogger<CustomerRepository> logger)
        : base(context.Customers, logger) { }

    public async Task<Customer?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.Id, id),
            fb.Eq(c => c.CompanyId, companyId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<(List<Customer> Items, string? ContinuationToken)> QueryAsync(
        string companyId, CustomerQueryParams query, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;

        // Base filter: company + promoted (temporary contacts hidden)
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.IsPromoted, true)
        );

        // Segment filter
        if (!string.IsNullOrEmpty(query.Segment))
        {
            if (query.Segment == "Organization")
            {
                filter = fb.And(filter, fb.Eq(c => c.CustomerType, "Organization"));
            }
            else
            {
                filter = fb.And(filter, fb.Eq("tags.name", query.Segment));
            }
        }

        // Search filter (regex on name, phone, email)
        if (!string.IsNullOrEmpty(query.Search))
        {
            BsonRegularExpression regex = new(query.Search, "i");
            FilterDefinition<Customer> searchFilter = fb.Or(
                fb.Regex(c => c.Name, regex),
                fb.Regex(c => c.Phone, regex),
                fb.Regex(c => c.Email, regex)
            );
            filter = fb.And(filter, searchFilter);
        }

        // Sort mapping
        SortDefinition<Customer> sort = query.Sort switch
        {
            "revenue" => Builders<Customer>.Sort.Descending(c => c.Ltv),
            "lastOrder" => Builders<Customer>.Sort.Descending(c => c.LastOrderTimestamp),
            "name" => Builders<Customer>.Sort.Ascending(c => c.Name),
            "newest" => Builders<Customer>.Sort.Descending(c => c.CreatedTimestamp),
            _ => Builders<Customer>.Sort.Descending(c => c.LastActivityTimestamp) // "recent" default
        };

        int pageSize = query.PageSize > 0 ? query.PageSize : 20;
        int skip = 0;
        if (!string.IsNullOrEmpty(query.ContinuationToken) && int.TryParse(query.ContinuationToken, out int parsedOffset))
        {
            skip = parsedOffset;
        }

        List<Customer> results = await _collection
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

    public Task<Customer> CreateAsync(Customer customer, CancellationToken ct = default)
        => CreateItemAsync(customer, ct);

    public Task<Customer> UpdateAsync(Customer customer, CancellationToken ct = default)
        => ReplaceItemAsync(customer, ct);

    public Task DeleteAsync(string id, string companyId, CancellationToken ct = default)
        => DeleteItemAsync(id, ct);

    public async Task<CustomerSegmentCounts> GetSegmentCountsAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;

        FilterDefinition<Customer> baseFilter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.IsPromoted, true)
        );

        long all = await _collection.CountDocumentsAsync(baseFilter, cancellationToken: ct);
        long hot = await _collection.CountDocumentsAsync(fb.And(baseFilter, fb.Eq("tags.name", "Hot")), cancellationToken: ct);
        long vip = await _collection.CountDocumentsAsync(fb.And(baseFilter, fb.Eq("tags.name", "VIP")), cancellationToken: ct);
        long atRisk = await _collection.CountDocumentsAsync(fb.And(baseFilter, fb.Eq("tags.name", "At-risk")), cancellationToken: ct);
        long newCount = await _collection.CountDocumentsAsync(fb.And(baseFilter, fb.Eq("tags.name", "New")), cancellationToken: ct);
        long cold = await _collection.CountDocumentsAsync(fb.And(baseFilter, fb.Eq("tags.name", "Cold")), cancellationToken: ct);
        long org = await _collection.CountDocumentsAsync(
            fb.And(baseFilter, fb.Eq(c => c.CustomerType, "Organization")), cancellationToken: ct);

        return new CustomerSegmentCounts
        {
            All = (int)all,
            Hot = (int)hot,
            Vip = (int)vip,
            AtRisk = (int)atRisk,
            New = (int)newCount,
            Cold = (int)cold,
            Organization = (int)org
        };
    }

    public async Task<Customer?> GetByPhoneAsync(string companyId, string phone, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.Phone, phone)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<Customer?> GetByEmailAsync(string companyId, string email, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.Email, email)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<decimal> GetTotalLtvAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.IsPromoted, true)
        );

        // Use aggregation to sum Ltv
        List<Customer> customers = await _collection
            .Find(filter)
            .Project(Builders<Customer>.Projection.Include(c => c.Ltv))
            .As<Customer>()
            .ToListAsync(ct);

        return customers.Sum(c => c.Ltv);
    }

    public async Task<int> GetNewThisWeekCountAsync(string companyId, CancellationToken ct = default)
    {
        long weekAgoMs = DateTimeOffset.UtcNow.AddDays(-7).ToUnixTimeMilliseconds();

        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.IsPromoted, true),
            fb.Gte(c => c.CreatedTimestamp, weekAgoMs)
        );

        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }

    public async Task<List<Customer>> GetActivePromotedBatchAsync(
        int skip, int batchSize, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.IsPromoted, true),
            fb.Eq(c => c.Status, "Active")
        );

        return await _collection
            .Find(filter)
            .Skip(skip)
            .Limit(batchSize)
            .ToListAsync(ct);
    }

    public async Task<List<Customer>> GetByOrganizationIdAsync(
        string companyId, string organizationId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.OrganizationId, organizationId),
            fb.Eq(c => c.IsPromoted, true)
        );
        return await _collection.Find(filter).ToListAsync(ct);
    }

    public async Task<Customer?> GetByTaxIdAsync(string companyId, string taxId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.TaxId, taxId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<Customer?> GetByNationalIdAsync(string companyId, string nationalId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Eq(c => c.NationalId, nationalId)
        );
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<List<Customer>> SearchByNameFuzzyAsync(
        string companyId, string name, int limit = 5, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        BsonRegularExpression regex = new(System.Text.RegularExpressions.Regex.Escape(name), "i");
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.Regex(c => c.Name, regex)
        );
        return await _collection.Find(filter).Limit(limit).ToListAsync(ct);
    }

    public async Task<List<Customer>> QueryByChannelChatUserIdAsync(
        string companyId, string chatUserId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Customer> fb = Builders<Customer>.Filter;
        FilterDefinition<Customer> filter = fb.And(
            fb.Eq(c => c.CompanyId, companyId),
            fb.ElemMatch(c => c.Channels, ch => ch.ChatUserId == chatUserId)
        );
        return await _collection.Find(filter).Limit(5).ToListAsync(ct);
    }
}

namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class SlipVerificationRepository : MongoRepositoryBase<SlipVerification>, ISlipVerificationRepository
{
    public SlipVerificationRepository(MongoDbContext context, ILogger<SlipVerificationRepository> logger)
        : base(context.SlipVerifications, logger) { }

    public async Task<SlipVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<SlipVerification> fb = Builders<SlipVerification>.Filter;
        FilterDefinition<SlipVerification> filter = fb.And(fb.Eq(s => s.Id, id), fb.Eq(s => s.CompanyId, companyId));
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public async Task<SlipVerification?> GetByOrderIdAsync(string orderId, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<SlipVerification> fb = Builders<SlipVerification>.Filter;
        FilterDefinition<SlipVerification> filter = fb.And(fb.Eq(s => s.OrderId, orderId), fb.Eq(s => s.CompanyId, companyId));
        return await _collection.Find(filter).SortByDescending(s => s.CreatedTimestamp).FirstOrDefaultAsync(ct);
    }

    public async Task<List<SlipVerification>> GetPendingReviewAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<SlipVerification> fb = Builders<SlipVerification>.Filter;
        FilterDefinition<SlipVerification> filter = fb.And(
            fb.Eq(s => s.CompanyId, companyId),
            fb.Eq(s => s.Status, SlipStatus.Pending),
            fb.Lt(s => s.Confidence, 1.0)
        );
        return await _collection.Find(filter).SortBy(s => s.CreatedTimestamp).Limit(50).ToListAsync(ct);
    }

    public Task<SlipVerification> CreateAsync(SlipVerification slip, CancellationToken ct = default)
        => CreateItemAsync(slip, ct);

    public Task<SlipVerification> UpdateAsync(SlipVerification slip, CancellationToken ct = default)
        => ReplaceItemAsync(slip, ct);

    public async Task<int> GetSubmissionCountAsync(string orderId, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<SlipVerification> fb = Builders<SlipVerification>.Filter;
        FilterDefinition<SlipVerification> filter = fb.And(
            fb.Eq(s => s.OrderId, orderId),
            fb.Eq(s => s.CompanyId, companyId),
            fb.Ne(s => s.Status, SlipStatus.Unreadable) // unreadable doesn't count
        );
        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return (int)count;
    }
}

public class SlipBlacklistRepository : MongoRepositoryBase<SlipBlacklist>, ISlipBlacklistRepository
{
    public SlipBlacklistRepository(MongoDbContext context, ILogger<SlipBlacklistRepository> logger)
        : base(context.SlipBlacklists, logger) { }

    public async Task<bool> IsBlacklistedAsync(string companyId, string accountNumber, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<SlipBlacklist> fb = Builders<SlipBlacklist>.Filter;
        FilterDefinition<SlipBlacklist> filter = fb.And(
            fb.Eq(b => b.CompanyId, companyId),
            fb.Eq(b => b.Fingerprint, accountNumber)
        );
        long count = await _collection.CountDocumentsAsync(filter, cancellationToken: ct);
        return count > 0;
    }

    public async Task<List<SlipBlacklist>> GetAllAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<SlipBlacklist> filter = Builders<SlipBlacklist>.Filter.Eq(b => b.CompanyId, companyId);
        return await _collection.Find(filter).SortByDescending(b => b.Timestamp).ToListAsync(ct);
    }

    public Task<SlipBlacklist> CreateAsync(SlipBlacklist entry, CancellationToken ct = default)
        => CreateItemAsync(entry, ct);

    public Task<SlipBlacklist> UpdateAsync(SlipBlacklist entry, CancellationToken ct = default)
        => ReplaceItemAsync(entry, ct);
}

namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class BookingRepository : MongoRepositoryBase<Booking>, IBookingRepository
{
    public BookingRepository(MongoDbContext context, ILogger<BookingRepository> logger)
        : base(context.Bookings, logger) { }

    public async Task<Booking?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Booking> fb = Builders<Booking>.Filter;
        return await _collection.Find(fb.And(fb.Eq(b => b.Id, id), fb.Eq(b => b.CompanyId, companyId))).FirstOrDefaultAsync(ct);
    }

    public async Task<(List<Booking> Items, string? ContinuationToken)> QueryAsync(
        string companyId, BookingQueryParams query, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Booking> fb = Builders<Booking>.Filter;
        FilterDefinition<Booking> filter = fb.Eq(b => b.CompanyId, companyId);

        if (!string.IsNullOrEmpty(query.Status)) filter = fb.And(filter, fb.Eq(b => b.Status, query.Status));
        if (!string.IsNullOrEmpty(query.AgentUserId)) filter = fb.And(filter, fb.Eq(b => b.AgentUserId, query.AgentUserId));
        if (query.FromTimestamp.HasValue) filter = fb.And(filter, fb.Gte(b => b.DateTimestamp, query.FromTimestamp.Value));
        if (query.ToTimestamp.HasValue) filter = fb.And(filter, fb.Lte(b => b.DateTimestamp, query.ToTimestamp.Value));
        if (!string.IsNullOrEmpty(query.Search))
        {
            BsonRegularExpression regex = new(query.Search, "i");
            filter = fb.And(filter, fb.Or(fb.Regex(b => b.CustomerName, regex), fb.Regex(b => b.BookingId, regex)));
        }

        int pageSize = query.PageSize > 0 ? query.PageSize : 20;
        int skip = 0;
        if (!string.IsNullOrEmpty(query.ContinuationToken) && int.TryParse(query.ContinuationToken, out int o)) skip = o;

        List<Booking> results = await _collection.Find(filter).SortBy(b => b.DateTimestamp).Skip(skip).Limit(pageSize + 1).ToListAsync(ct);
        bool hasMore = results.Count > pageSize;
        if (hasMore) results.RemoveAt(results.Count - 1);
        return (results, hasMore ? (skip + pageSize).ToString() : null);
    }

    public Task<Booking> CreateAsync(Booking booking, CancellationToken ct = default) => CreateItemAsync(booking, ct);
    public Task<Booking> UpdateAsync(Booking booking, CancellationToken ct = default) => ReplaceItemAsync(booking, ct);

    public async Task<int> GetNextSequenceAsync(string companyId, CancellationToken ct = default)
    {
        long count = await _collection.CountDocumentsAsync(Builders<Booking>.Filter.Eq(b => b.CompanyId, companyId), cancellationToken: ct);
        return (int)count + 1;
    }

    public async Task<List<Booking>> GetUpcomingRemindersAsync(long fromTimestamp, long toTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Booking> fb = Builders<Booking>.Filter;
        return await _collection.Find(fb.And(
            fb.Eq(b => b.Status, BookingStatus.Confirmed),
            fb.Eq(b => b.ReminderSent, false),
            fb.Gte(b => b.DateTimestamp, fromTimestamp),
            fb.Lte(b => b.DateTimestamp, toTimestamp)
        )).Limit(100).ToListAsync(ct);
    }

    public async Task<List<Booking>> GetByAgentAndDateRangeAsync(string companyId, string agentUserId, long from, long to, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Booking> fb = Builders<Booking>.Filter;
        return await _collection.Find(fb.And(
            fb.Eq(b => b.CompanyId, companyId),
            fb.Eq(b => b.AgentUserId, agentUserId),
            fb.Gte(b => b.DateTimestamp, from),
            fb.Lte(b => b.DateTimestamp, to),
            fb.Ne(b => b.Status, BookingStatus.Cancelled)
        )).SortBy(b => b.DateTimestamp).ToListAsync(ct);
    }

    public async Task<bool> HasConflictAsync(string companyId, string agentUserId, long startTimestamp, long endTimestamp, CancellationToken ct = default)
    {
        FilterDefinitionBuilder<Booking> fb = Builders<Booking>.Filter;
        long count = await _collection.CountDocumentsAsync(fb.And(
            fb.Eq(b => b.CompanyId, companyId),
            fb.Eq(b => b.AgentUserId, agentUserId),
            fb.Ne(b => b.Status, BookingStatus.Cancelled),
            fb.Lt(b => b.DateTimestamp, endTimestamp),
            fb.Gt(b => b.EndTimestamp, startTimestamp)
        ), cancellationToken: ct);
        return count > 0;
    }
}

public class BookingServiceRepository : MongoRepositoryBase<BookingService>, IBookingServiceRepository
{
    public BookingServiceRepository(MongoDbContext context, ILogger<BookingServiceRepository> logger)
        : base(context.BookingServices, logger) { }

    public async Task<List<BookingService>> GetActiveAsync(string companyId, CancellationToken ct = default)
    {
        return await _collection.Find(Builders<BookingService>.Filter.And(
            Builders<BookingService>.Filter.Eq(s => s.CompanyId, companyId),
            Builders<BookingService>.Filter.Eq(s => s.IsActive, true)
        )).ToListAsync(ct);
    }

    public async Task<BookingService?> GetByIdAsync(string id, string companyId, CancellationToken ct = default)
    {
        return await _collection.Find(Builders<BookingService>.Filter.And(
            Builders<BookingService>.Filter.Eq(s => s.Id, id),
            Builders<BookingService>.Filter.Eq(s => s.CompanyId, companyId)
        )).FirstOrDefaultAsync(ct);
    }

    public Task<BookingService> CreateAsync(BookingService service, CancellationToken ct = default) => CreateItemAsync(service, ct);
    public Task<BookingService> UpdateAsync(BookingService service, CancellationToken ct = default) => ReplaceItemAsync(service, ct);
    public Task DeleteAsync(string id, CancellationToken ct = default) => DeleteItemAsync(id, ct);
}

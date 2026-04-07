namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AiActivityLogRepository : IAiActivityLogRepository
{
    private readonly IMongoCollection<AiActivityLog> _collection;

    public AiActivityLogRepository(MongoDbContext dbContext)
    {
        _collection = dbContext.Database.GetCollection<AiActivityLog>("AiActivityLogs");
    }

    public async Task CreateAsync(AiActivityLog log, CancellationToken ct)
    {
        await _collection.InsertOneAsync(log, cancellationToken: ct);
    }

    public async Task<List<AiActivityLog>> GetByRoomAsync(string companyId, string roomId, int limit, CancellationToken ct)
    {
        return await _collection
            .Find(x => x.CompanyId == companyId && x.RoomId == roomId)
            .SortByDescending(x => x.Timestamp)
            .Limit(limit)
            .ToListAsync(ct);
    }

    public async Task<List<AiActivityLog>> GetByCompanyAsync(string companyId, string? eventType, int limit, CancellationToken ct)
    {
        FilterDefinitionBuilder<AiActivityLog> builder = Builders<AiActivityLog>.Filter;
        FilterDefinition<AiActivityLog> filter = builder.Eq(x => x.CompanyId, companyId);
        if (!string.IsNullOrEmpty(eventType))
            filter &= builder.Eq(x => x.EventType, eventType);

        return await _collection
            .Find(filter)
            .SortByDescending(x => x.Timestamp)
            .Limit(limit)
            .ToListAsync(ct);
    }
}

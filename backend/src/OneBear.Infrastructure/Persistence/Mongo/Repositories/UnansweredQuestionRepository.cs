namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class UnansweredQuestionRepository : IUnansweredQuestionRepository
{
    private readonly IMongoCollection<UnansweredQuestion> _collection;

    public UnansweredQuestionRepository(MongoDbContext dbContext)
    {
        _collection = dbContext.Database.GetCollection<UnansweredQuestion>("UnansweredQuestions");
    }

    public async Task<UnansweredQuestion> UpsertAsync(string companyId, string question, string? roomId, CancellationToken ct)
    {
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        FilterDefinition<UnansweredQuestion> filter = Builders<UnansweredQuestion>.Filter.And(
            Builders<UnansweredQuestion>.Filter.Eq(x => x.CompanyId, companyId),
            Builders<UnansweredQuestion>.Filter.Eq(x => x.Question, question));

        UpdateDefinition<UnansweredQuestion> update = Builders<UnansweredQuestion>.Update
            .Inc(x => x.Frequency, 1)
            .Set(x => x.LastAskedTimestamp, now)
            .Set(x => x.LastRoomId, roomId)
            .SetOnInsert(x => x.Id, Guid.NewGuid().ToString())
            .SetOnInsert(x => x.CompanyId, companyId)
            .SetOnInsert(x => x.Question, question);

        FindOneAndUpdateOptions<UnansweredQuestion> options = new()
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        UnansweredQuestion result = await _collection.FindOneAndUpdateAsync(filter, update, options, ct);
        return result;
    }

    public async Task<List<UnansweredQuestion>> GetByCompanyAsync(string companyId, int limit, CancellationToken ct)
    {
        return await _collection
            .Find(x => x.CompanyId == companyId)
            .SortByDescending(x => x.Frequency)
            .Limit(limit)
            .ToListAsync(ct);
    }

    public async Task DeleteAsync(string id, CancellationToken ct)
    {
        await _collection.DeleteOneAsync(x => x.Id == id, ct);
    }

    public async Task<UnansweredQuestion?> GetByIdAsync(string id, CancellationToken ct)
    {
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
    }
}

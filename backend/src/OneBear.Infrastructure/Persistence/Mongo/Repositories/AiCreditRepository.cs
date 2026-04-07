namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AiCreditRepository : IAiCreditRepository
{
    private readonly IMongoCollection<AiCredit> _collection;

    public AiCreditRepository(MongoDbContext dbContext)
    {
        _collection = dbContext.Database.GetCollection<AiCredit>("AiCredits");
    }

    public async Task<AiCredit?> GetByCompanyIdAsync(string companyId, CancellationToken ct)
    {
        return await _collection.Find(x => x.CompanyId == companyId).FirstOrDefaultAsync(ct);
    }

    public async Task<AiCredit> UpsertAsync(AiCredit credit, CancellationToken ct)
    {
        FilterDefinition<AiCredit> filter = Builders<AiCredit>.Filter.Eq(x => x.CompanyId, credit.CompanyId);
        ReplaceOptions options = new() { IsUpsert = true };
        await _collection.ReplaceOneAsync(filter, credit, options, ct);
        return credit;
    }

    public async Task<AiCredit> IncrementUsedAsync(string companyId, int amount, CancellationToken ct)
    {
        FilterDefinition<AiCredit> filter = Builders<AiCredit>.Filter.Eq(x => x.CompanyId, companyId);
        UpdateDefinition<AiCredit> update = Builders<AiCredit>.Update
            .Inc(x => x.CreditUsed, amount)
            .Set(x => x.LastDeductTimestamp, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        FindOneAndUpdateOptions<AiCredit> options = new() { ReturnDocument = ReturnDocument.After };
        AiCredit result = await _collection.FindOneAndUpdateAsync(filter, update, options, ct);
        return result;
    }
}

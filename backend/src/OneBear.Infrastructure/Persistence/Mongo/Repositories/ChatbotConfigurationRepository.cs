namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatbotConfigurationRepository : MongoRepositoryBase<ChatbotConfiguration>, IChatbotConfigurationRepository
{
    public ChatbotConfigurationRepository(MongoDbContext context, ILogger<ChatbotConfigurationRepository> logger)
        : base(context.ChatbotConfigurations, logger) { }

    public async Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        FilterDefinition<ChatbotConfiguration> filter = Builders<ChatbotConfiguration>.Filter.Eq(c => c.CompanyId, companyId);
        return await _collection.Find(filter).FirstOrDefaultAsync(ct);
    }

    public Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default)
        => UpsertItemAsync(config, ct);
}

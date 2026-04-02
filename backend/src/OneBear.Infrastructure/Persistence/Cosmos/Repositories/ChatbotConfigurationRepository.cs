namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatbotConfigurationRepository : CosmosRepositoryBase<ChatbotConfiguration>, IChatbotConfigurationRepository
{
    public ChatbotConfigurationRepository(CosmosDbContext context, ILogger<ChatbotConfigurationRepository> logger)
        : base(context.ChatbotConfigurations, logger) { }

    protected override string GetEntityId(ChatbotConfiguration entity) => entity.Id;

    public async Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.companyId = @companyId")
            .WithParameter("@companyId", companyId);

        (List<ChatbotConfiguration> items, _) = await QueryAsync<ChatbotConfiguration>(
            query, new PartitionKey(companyId), 1, null, ct);
        return items.FirstOrDefault();
    }

    public Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default)
        => UpsertItemAsync(config, new PartitionKey(config.CompanyId), ct);
}

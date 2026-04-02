namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class ChatbotConfigurationRepository : IChatbotConfigurationRepository
{
    private readonly CosmosDbContext _context;

    public ChatbotConfigurationRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default)
        => throw new NotImplementedException();
}

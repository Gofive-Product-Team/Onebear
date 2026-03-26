namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class ChatbotConfigurationRepository : IChatbotConfigurationRepository
{
    private readonly CosmosDbContext _context;

    public ChatbotConfigurationRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

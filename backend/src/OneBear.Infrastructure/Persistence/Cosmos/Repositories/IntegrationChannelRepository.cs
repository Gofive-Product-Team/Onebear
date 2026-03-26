namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class IntegrationChannelRepository : IIntegrationChannelRepository
{
    private readonly CosmosDbContext _context;

    public IntegrationChannelRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

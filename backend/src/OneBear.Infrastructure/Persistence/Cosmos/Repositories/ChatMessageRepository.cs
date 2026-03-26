namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class ChatMessageRepository : IChatMessageRepository
{
    private readonly CosmosDbContext _context;

    public ChatMessageRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

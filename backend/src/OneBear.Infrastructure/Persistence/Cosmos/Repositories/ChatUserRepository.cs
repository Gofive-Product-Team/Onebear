namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class ChatUserRepository : IChatUserRepository
{
    private readonly CosmosDbContext _context;

    public ChatUserRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

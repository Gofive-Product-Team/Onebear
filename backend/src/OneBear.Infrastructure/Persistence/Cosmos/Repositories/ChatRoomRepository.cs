namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class ChatRoomRepository : IChatRoomRepository
{
    private readonly CosmosDbContext _context;

    public ChatRoomRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

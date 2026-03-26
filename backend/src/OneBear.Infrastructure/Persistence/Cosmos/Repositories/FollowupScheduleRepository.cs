namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class FollowupScheduleRepository : IFollowupScheduleRepository
{
    private readonly CosmosDbContext _context;

    public FollowupScheduleRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

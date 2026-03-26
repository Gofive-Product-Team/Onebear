namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Interfaces.Repositories;

public class AttachmentRepository : IAttachmentRepository
{
    private readonly CosmosDbContext _context;

    public AttachmentRepository(CosmosDbContext context)
    {
        _context = context;
    }

    // TODO: implement repository methods
}

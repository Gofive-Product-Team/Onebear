namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AttachmentRepository : IAttachmentRepository
{
    private readonly CosmosDbContext _context;

    public AttachmentRepository(CosmosDbContext context)
    {
        _context = context;
    }

    public Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default)
        => throw new NotImplementedException();

    public Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default)
        => throw new NotImplementedException();
}

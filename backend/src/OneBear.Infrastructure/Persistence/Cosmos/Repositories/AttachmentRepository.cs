namespace OneBear.Infrastructure.Persistence.Cosmos.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AttachmentRepository : CosmosRepositoryBase<Attachment>, IAttachmentRepository
{
    public AttachmentRepository(CosmosDbContext context, ILogger<AttachmentRepository> logger)
        : base(context.Attachments, logger) { }

    protected override string GetEntityId(Attachment entity) => entity.Id;

    public Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, new PartitionKey(roomId), ct);

    public async Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default)
    {
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC")
            .WithParameter("@roomId", roomId);

        (List<Attachment> items, _) = await QueryAsync<Attachment>(
            query, new PartitionKey(roomId), 100, null, ct);
        return items;
    }

    public Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default)
        => CreateItemAsync(attachment, new PartitionKey(attachment.RoomId), ct);
}

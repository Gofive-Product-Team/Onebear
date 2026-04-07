namespace OneBear.Infrastructure.Persistence.Mongo.Repositories;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class AttachmentRepository : MongoRepositoryBase<Attachment>, IAttachmentRepository
{
    public AttachmentRepository(MongoDbContext context, ILogger<AttachmentRepository> logger)
        : base(context.Attachments, logger) { }

    public Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default)
        => ReadAsync(id, ct);

    public async Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default)
    {
        FilterDefinition<Attachment> filter = Builders<Attachment>.Filter.Eq(a => a.RoomId, roomId);
        SortDefinition<Attachment> sort = Builders<Attachment>.Sort.Descending(a => a.Timestamp);

        return await _collection.Find(filter).Sort(sort).Limit(100).ToListAsync(ct);
    }

    public Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default)
        => CreateItemAsync(attachment, ct);
}

namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IAttachmentRepository
{
    Task<Attachment?> GetByIdAsync(string id, string roomId, CancellationToken ct = default);
    Task<List<Attachment>> GetByRoomIdAsync(string roomId, CancellationToken ct = default);
    Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default);
}

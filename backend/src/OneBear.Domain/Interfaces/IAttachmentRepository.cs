namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IAttachmentRepository
{
    Task<Attachment?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<Attachment> Items, string? ContinuationToken)> ListByMessageAsync(string messageId, string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<Attachment> CreateAsync(Attachment attachment, CancellationToken ct = default);
}

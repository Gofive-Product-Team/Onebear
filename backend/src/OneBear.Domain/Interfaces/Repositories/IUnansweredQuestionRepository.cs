namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IUnansweredQuestionRepository
{
    Task<UnansweredQuestion> UpsertAsync(string companyId, string question, string? roomId, CancellationToken ct);
    Task<List<UnansweredQuestion>> GetByCompanyAsync(string companyId, int limit, CancellationToken ct);
    Task DeleteAsync(string id, CancellationToken ct);
    Task<UnansweredQuestion?> GetByIdAsync(string id, CancellationToken ct);
}

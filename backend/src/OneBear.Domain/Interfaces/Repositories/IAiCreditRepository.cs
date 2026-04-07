namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IAiCreditRepository
{
    Task<AiCredit?> GetByCompanyIdAsync(string companyId, CancellationToken ct);
    Task<AiCredit> UpsertAsync(AiCredit credit, CancellationToken ct);
    Task<AiCredit> IncrementUsedAsync(string companyId, int amount, CancellationToken ct);
}

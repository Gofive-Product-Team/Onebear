namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface ISlipVerificationRepository
{
    Task<SlipVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<SlipVerification?> GetByOrderIdAsync(string orderId, string companyId, CancellationToken ct = default);
    Task<List<SlipVerification>> GetPendingReviewAsync(string companyId, CancellationToken ct = default);
    Task<SlipVerification> CreateAsync(SlipVerification slip, CancellationToken ct = default);
    Task<SlipVerification> UpdateAsync(SlipVerification slip, CancellationToken ct = default);
    Task<int> GetSubmissionCountAsync(string orderId, string companyId, CancellationToken ct = default);
}

public interface ISlipBlacklistRepository
{
    Task<bool> IsBlacklistedAsync(string companyId, string accountNumber, CancellationToken ct = default);
    Task<List<SlipBlacklist>> GetAllAsync(string companyId, CancellationToken ct = default);
    Task<SlipBlacklist> CreateAsync(SlipBlacklist entry, CancellationToken ct = default);
    Task<SlipBlacklist> UpdateAsync(SlipBlacklist entry, CancellationToken ct = default);
}

namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IUserVerificationRepository
{
    Task<UserVerification?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<List<UserVerification>> GetByUserIdAsync(string companyId, string userId, CancellationToken ct = default);
    Task<UserVerification> CreateAsync(UserVerification verification, CancellationToken ct = default);
    Task<UserVerification> UpdateAsync(UserVerification verification, CancellationToken ct = default);
}

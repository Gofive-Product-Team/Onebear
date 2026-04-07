namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByKeycloakUserIdAsync(string keycloakUserId, CancellationToken ct);
    Task<UserProfile?> GetByEmailAsync(string email, CancellationToken ct);
    Task<List<UserProfile>> GetByCompanyIdAsync(string companyId, CancellationToken ct);
    Task<UserProfile> CreateAsync(UserProfile profile, CancellationToken ct);
    Task<UserProfile> UpdateAsync(UserProfile profile, CancellationToken ct);
}

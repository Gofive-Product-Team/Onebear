namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(List<Customer> Items, string? ContinuationToken)> QueryAsync(string companyId, CustomerQueryParams query, CancellationToken ct = default);
    Task<Customer> CreateAsync(Customer customer, CancellationToken ct = default);
    Task<Customer> UpdateAsync(Customer customer, CancellationToken ct = default);
    Task DeleteAsync(string id, string companyId, CancellationToken ct = default);
    Task<CustomerSegmentCounts> GetSegmentCountsAsync(string companyId, CancellationToken ct = default);
    Task<Customer?> GetByPhoneAsync(string companyId, string phone, CancellationToken ct = default);
    Task<Customer?> GetByEmailAsync(string companyId, string email, CancellationToken ct = default);
    Task<decimal> GetTotalLtvAsync(string companyId, CancellationToken ct = default);
    Task<int> GetNewThisWeekCountAsync(string companyId, CancellationToken ct = default);
    Task<List<Customer>> GetActivePromotedBatchAsync(int skip, int batchSize, CancellationToken ct = default);

    // Organization contact management (Phase 3)
    Task<List<Customer>> GetByOrganizationIdAsync(string companyId, string organizationId, CancellationToken ct = default);

    // Duplicate detection (Phase 3)
    Task<Customer?> GetByTaxIdAsync(string companyId, string taxId, CancellationToken ct = default);
    Task<Customer?> GetByNationalIdAsync(string companyId, string nationalId, CancellationToken ct = default);
    Task<List<Customer>> SearchByNameFuzzyAsync(string companyId, string name, int limit = 5, CancellationToken ct = default);

    // ChatUser → Customer linking
    Task<List<Customer>> QueryByChannelChatUserIdAsync(string companyId, string chatUserId, CancellationToken ct = default);
}

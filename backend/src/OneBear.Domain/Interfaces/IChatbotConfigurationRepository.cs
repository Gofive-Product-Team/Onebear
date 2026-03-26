namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Entities;

public interface IChatbotConfigurationRepository
{
    Task<ChatbotConfiguration?> GetByIdAsync(string id, string companyId, CancellationToken ct = default);
    Task<(IReadOnlyList<ChatbotConfiguration> Items, string? ContinuationToken)> ListAsync(string companyId, int pageSize, string? continuationToken, CancellationToken ct = default);
    Task<ChatbotConfiguration> CreateAsync(ChatbotConfiguration config, CancellationToken ct = default);
    Task<ChatbotConfiguration> UpdateAsync(ChatbotConfiguration config, CancellationToken ct = default);
}

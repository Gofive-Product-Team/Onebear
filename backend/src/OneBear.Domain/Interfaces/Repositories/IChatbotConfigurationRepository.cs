namespace OneBear.Domain.Interfaces.Repositories;

using OneBear.Domain.Entities;

public interface IChatbotConfigurationRepository
{
    Task<ChatbotConfiguration?> GetByCompanyIdAsync(string companyId, CancellationToken ct = default);
    Task<ChatbotConfiguration> UpsertAsync(ChatbotConfiguration config, CancellationToken ct = default);
}

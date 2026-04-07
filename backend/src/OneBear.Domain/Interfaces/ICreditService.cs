namespace OneBear.Domain.Interfaces;

using OneBear.Domain.ValueObjects;

public interface ICreditService
{
    Task<bool> HasCreditAsync(string companyId, CancellationToken ct);
    Task<CreditStatusDto> GetStatusAsync(string companyId, CancellationToken ct);
    Task<CreditStatusDto> DeductAsync(string companyId, int amount, string reason, string? roomId, CancellationToken ct);
    Task<CreditStatusDto> TopUpAsync(string companyId, int amount, string reason, CancellationToken ct);
}

namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Common;

public interface IPaymentLinkService
{
    Task<Result<PaymentLinkResult>> GenerateAsync(string companyId, string orderId, decimal amount, int expiryHours, CancellationToken ct);
    Task<Result<PaymentLinkResult>> GetByOrderIdAsync(string companyId, string orderId, CancellationToken ct);
}

public class PaymentLinkResult
{
    public string Url { get; set; } = "";
    public string OrderId { get; set; } = "";
    public decimal Amount { get; set; }
    public long ExpiresAtTimestamp { get; set; }
}

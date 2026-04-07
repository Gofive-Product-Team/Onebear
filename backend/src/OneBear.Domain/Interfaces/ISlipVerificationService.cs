namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Common;

public interface ISlipVerificationService
{
    Task<Result<SlipVerificationResult>> VerifyAsync(string companyId, string imageUrl, string orderId, CancellationToken ct);
}

public class SlipVerificationResult
{
    public bool IsValid { get; set; }
    public string Fingerprint { get; set; } = "";
    public decimal? Amount { get; set; }
    public string? BankCode { get; set; }
    public string? Reason { get; set; }
}

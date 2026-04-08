namespace OneBear.Application.Slips.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Slips.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class SlipVerificationManagementService : ISlipVerificationService
{
    private readonly ISlipVerificationRepository _slipRepo;
    private readonly ISlipBlacklistRepository _blacklistRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly ILogger<SlipVerificationManagementService> _logger;

    private const int MaxReadableSubmissions = 3;

    public SlipVerificationManagementService(
        ISlipVerificationRepository slipRepo,
        ISlipBlacklistRepository blacklistRepo,
        IOrderRepository orderRepo,
        ILogger<SlipVerificationManagementService> logger)
    {
        _slipRepo = slipRepo;
        _blacklistRepo = blacklistRepo;
        _orderRepo = orderRepo;
        _logger = logger;
    }

    // ─── ISlipVerificationService (domain interface for AI/chatbot) ──────────

    public async Task<Result<SlipVerificationResult>> VerifyAsync(
        string companyId, string imageUrl, string orderId, CancellationToken ct)
    {
        Result<SlipVerificationDto> result = await SubmitSlipAsync(companyId, "system", new SubmitSlipRequest
        {
            OrderId = orderId,
            ImageUrl = imageUrl,
        }, ct);

        if (result is Result<SlipVerificationDto>.Failure f)
            return new Result<SlipVerificationResult>.Failure(f.Error);

        SlipVerificationDto dto = ((Result<SlipVerificationDto>.Success)result).Value;
        return new Result<SlipVerificationResult>.Success(new SlipVerificationResult
        {
            IsValid = dto.Status == SlipStatus.Approved,
            Fingerprint = dto.ExtractedAccountName ?? "",
            Amount = dto.ExtractedAmount,
            BankCode = dto.ExtractedBankCode,
            Reason = dto.RejectionReasonCode,
        });
    }

    // ─── Submit Slip ─────────────────────────────────────────────────────────

    public async Task<Result<SlipVerificationDto>> SubmitSlipAsync(
        string companyId, string userId, SubmitSlipRequest request, CancellationToken ct)
    {
        // Check submission count
        int count = await _slipRepo.GetSubmissionCountAsync(request.OrderId, companyId, ct);
        if (count >= MaxReadableSubmissions)
            return new Result<SlipVerificationDto>.Failure(
                new Error("MAX_SUBMISSIONS", "Maximum slip submissions reached. Admin review required.", ErrorType.Validation));

        // Simulate AI verification (in production, call external AI service)
        AiVerificationResult aiResult = SimulateAiVerification(request.ImageUrl);

        // Check blacklist FIRST
        bool isBlacklisted = false;
        if (aiResult.AccountNumber is not null)
            isBlacklisted = await _blacklistRepo.IsBlacklistedAsync(companyId, aiResult.AccountNumber, ct);

        // Determine status
        string status;
        if (isBlacklisted)
            status = SlipStatus.Rejected;
        else if (!aiResult.IsReadable)
            status = SlipStatus.Unreadable;
        else if (aiResult.Confidence >= 1.0)
            status = SlipStatus.Approved;
        else
            status = SlipStatus.Pending; // needs manual review

        SlipVerification slip = new()
        {
            CompanyId = companyId,
            OrderId = request.OrderId,
            ImageUrl = request.ImageUrl,
            Status = status,
            Confidence = aiResult.Confidence,
            ExtractedAmount = aiResult.Amount,
            ExtractedBankCode = aiResult.BankCode,
            ExtractedAccountNumber = aiResult.AccountNumber,
            ExtractedAccountName = aiResult.AccountName,
            ExtractedTimestamp = aiResult.TransferTimestamp,
            BankLogoRecognized = aiResult.BankLogoRecognized,
            AmountMatches = aiResult.AmountMatches,
            TimestampValid = aiResult.TimestampValid,
            AccountMatches = aiResult.AccountMatches,
            IsBlacklisted = isBlacklisted,
            SubmissionCount = count + (status != SlipStatus.Unreadable ? 1 : 0),
            ManualReviewRequired = (count + 1) >= MaxReadableSubmissions && status == SlipStatus.Pending,
            CreatedBy = userId,
        };

        SlipVerification created = await _slipRepo.CreateAsync(slip, ct);

        // If auto-approved (100% confidence), update order status
        if (status == SlipStatus.Approved)
        {
            await TryUpdateOrderToPaid(companyId, request.OrderId, ct);
        }

        _logger.LogInformation("Slip submitted for order {OrderId}: status={Status}, confidence={Confidence}",
            request.OrderId, status, aiResult.Confidence);

        return new Result<SlipVerificationDto>.Success(MapToDto(created));
    }

    // ─── Admin Review ────────────────────────────────────────────────────────

    public async Task<Result<SlipVerificationDto>> ReviewSlipAsync(
        string slipId, string companyId, string userId, ReviewSlipRequest request, CancellationToken ct)
    {
        SlipVerification? slip = await _slipRepo.GetByIdAsync(slipId, companyId, ct);
        if (slip is null)
            return new Result<SlipVerificationDto>.Failure(new Error("SLIP_NOT_FOUND", "Slip not found", ErrorType.NotFound));

        if (slip.Status != SlipStatus.Pending)
            return new Result<SlipVerificationDto>.Failure(new Error("INVALID_STATUS", "Slip is not pending review", ErrorType.Validation));

        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        if (request.Action == "approve")
        {
            slip.Status = SlipStatus.Approved;
            slip.ReviewedBy = userId;
            slip.ReviewedTimestamp = now;
            slip.AdminNote = request.AdminNote;

            await _slipRepo.UpdateAsync(slip, ct);
            await TryUpdateOrderToPaid(companyId, slip.OrderId, ct);
        }
        else if (request.Action == "reject")
        {
            if (string.IsNullOrEmpty(request.RejectionReasonCode))
                return new Result<SlipVerificationDto>.Failure(new Error("REASON_REQUIRED", "Rejection reason is required", ErrorType.Validation));

            slip.Status = SlipStatus.Rejected;
            slip.ReviewedBy = userId;
            slip.ReviewedTimestamp = now;
            slip.RejectionReasonCode = request.RejectionReasonCode;
            slip.AdminNote = request.AdminNote;

            await _slipRepo.UpdateAsync(slip, ct);
        }
        // "request_info" keeps status as Pending

        slip.UpdatedBy = userId;
        await _slipRepo.UpdateAsync(slip, ct);

        _logger.LogInformation("Slip {SlipId} reviewed: action={Action} by {UserId}", slipId, request.Action, userId);
        return new Result<SlipVerificationDto>.Success(MapToDto(slip));
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    public async Task<List<SlipVerificationDto>> GetPendingReviewAsync(string companyId, CancellationToken ct)
    {
        List<SlipVerification> slips = await _slipRepo.GetPendingReviewAsync(companyId, ct);
        return slips.Select(MapToDto).ToList();
    }

    public async Task<Result<SlipVerificationDto>> GetByOrderIdAsync(string orderId, string companyId, CancellationToken ct)
    {
        SlipVerification? slip = await _slipRepo.GetByOrderIdAsync(orderId, companyId, ct);
        if (slip is null)
            return new Result<SlipVerificationDto>.Failure(new Error("SLIP_NOT_FOUND", "No slip found for this order", ErrorType.NotFound));

        return new Result<SlipVerificationDto>.Success(MapToDto(slip));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async Task TryUpdateOrderToPaid(string companyId, string orderId, CancellationToken ct)
    {
        Order? order = await _orderRepo.GetByOrderIdAsync(orderId, companyId, ct);
        if (order is not null && order.Status == OrderStatus.PendingVerify)
        {
            order.Status = OrderStatus.Completed;
            order.PaidAmount = order.Total;
            order.PaidTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            order.StockDeducted = true;
            if (order.PaymentLink is not null) order.PaymentLink.Status = "Completed";
            await _orderRepo.UpdateAsync(order, ct);
        }
    }

    /// <summary>Simulate AI slip verification. In production, replace with real AI service call.</summary>
    private static AiVerificationResult SimulateAiVerification(string imageUrl)
    {
        // Stub: returns moderate confidence requiring manual review
        // Real implementation would call an OCR/AI service
        return new AiVerificationResult
        {
            IsReadable = true,
            Confidence = 0.85,
            Amount = null,
            BankCode = null,
            AccountNumber = null,
            AccountName = null,
            TransferTimestamp = null,
            BankLogoRecognized = true,
            AmountMatches = null,
            TimestampValid = true,
            AccountMatches = null,
        };
    }

    private static SlipVerificationDto MapToDto(SlipVerification s) => new()
    {
        Id = s.Id,
        OrderId = s.OrderId,
        ImageUrl = s.ImageUrl,
        Status = s.Status,
        Confidence = s.Confidence,
        ExtractedAmount = s.ExtractedAmount,
        ExtractedBankCode = s.ExtractedBankCode,
        ExtractedAccountName = s.ExtractedAccountName,
        BankLogoRecognized = s.BankLogoRecognized,
        AmountMatches = s.AmountMatches,
        TimestampValid = s.TimestampValid,
        AccountMatches = s.AccountMatches,
        IsBlacklisted = s.IsBlacklisted,
        ReviewedBy = s.ReviewedBy,
        ReviewedTimestamp = s.ReviewedTimestamp,
        RejectionReasonCode = s.RejectionReasonCode,
        RejectionMessage = s.RejectionReasonCode is not null ? RejectionReasonCode.GetCustomerMessage(s.RejectionReasonCode) : null,
        SubmissionCount = s.SubmissionCount,
        ManualReviewRequired = s.ManualReviewRequired,
        CreatedTimestamp = s.CreatedTimestamp,
    };

    private class AiVerificationResult
    {
        public bool IsReadable { get; set; }
        public double Confidence { get; set; }
        public decimal? Amount { get; set; }
        public string? BankCode { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
        public long? TransferTimestamp { get; set; }
        public bool? BankLogoRecognized { get; set; }
        public bool? AmountMatches { get; set; }
        public bool? TimestampValid { get; set; }
        public bool? AccountMatches { get; set; }
    }
}

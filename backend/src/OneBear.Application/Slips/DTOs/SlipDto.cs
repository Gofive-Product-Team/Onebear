namespace OneBear.Application.Slips.DTOs;

public record SlipVerificationDto
{
    public string Id { get; init; } = default!;
    public string OrderId { get; init; } = default!;
    public string ImageUrl { get; init; } = default!;
    public string Status { get; init; } = default!;
    public double? Confidence { get; init; }
    public decimal? ExtractedAmount { get; init; }
    public string? ExtractedBankCode { get; init; }
    public string? ExtractedAccountName { get; init; }
    public bool? BankLogoRecognized { get; init; }
    public bool? AmountMatches { get; init; }
    public bool? TimestampValid { get; init; }
    public bool? AccountMatches { get; init; }
    public bool IsBlacklisted { get; init; }
    public string? ReviewedBy { get; init; }
    public long? ReviewedTimestamp { get; init; }
    public string? RejectionReasonCode { get; init; }
    public string? RejectionMessage { get; init; }
    public int SubmissionCount { get; init; }
    public bool ManualReviewRequired { get; init; }
    public long CreatedTimestamp { get; init; }
}

public record SubmitSlipRequest
{
    public string OrderId { get; init; } = default!;
    public string ImageUrl { get; init; } = default!;
}

public record ReviewSlipRequest
{
    public string Action { get; init; } = default!; // "approve" | "reject" | "request_info"
    public string? RejectionReasonCode { get; init; }
    public string? AdminNote { get; init; }
}

public record SlipBlacklistDto
{
    public string Id { get; init; } = default!;
    public string Fingerprint { get; init; } = default!;
    public string? OrderId { get; init; }
    public string Result { get; init; } = default!;
    public string ApprovedBy { get; init; } = default!;
    public long Timestamp { get; init; }
}

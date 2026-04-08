namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class SlipVerification : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = default!;

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = default!;

    [JsonPropertyName("status")]
    public string Status { get; set; } = SlipStatus.Pending; // Pending | Approved | Rejected | Unreadable

    [JsonPropertyName("confidence")]
    public double? Confidence { get; set; }

    // AI extraction
    [JsonPropertyName("extractedAmount")]
    public decimal? ExtractedAmount { get; set; }

    [JsonPropertyName("extractedBankCode")]
    public string? ExtractedBankCode { get; set; }

    [JsonPropertyName("extractedAccountNumber")]
    public string? ExtractedAccountNumber { get; set; }

    [JsonPropertyName("extractedAccountName")]
    public string? ExtractedAccountName { get; set; }

    [JsonPropertyName("extractedTimestamp")]
    public long? ExtractedTimestamp { get; set; }

    // AI check results
    [JsonPropertyName("bankLogoRecognized")]
    public bool? BankLogoRecognized { get; set; }

    [JsonPropertyName("amountMatches")]
    public bool? AmountMatches { get; set; }

    [JsonPropertyName("timestampValid")]
    public bool? TimestampValid { get; set; }

    [JsonPropertyName("accountMatches")]
    public bool? AccountMatches { get; set; }

    [JsonPropertyName("isBlacklisted")]
    public bool IsBlacklisted { get; set; }

    // Review
    [JsonPropertyName("reviewedBy")]
    public string? ReviewedBy { get; set; }

    [JsonPropertyName("reviewedTimestamp")]
    public long? ReviewedTimestamp { get; set; }

    [JsonPropertyName("rejectionReasonCode")]
    public string? RejectionReasonCode { get; set; }

    [JsonPropertyName("adminNote")]
    public string? AdminNote { get; set; }

    // Retry tracking
    [JsonPropertyName("submissionCount")]
    public int SubmissionCount { get; set; } = 1;

    [JsonPropertyName("manualReviewRequired")]
    public bool ManualReviewRequired { get; set; }

    // Audit
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }
}

public static class SlipStatus
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Unreadable = "Unreadable";
}

public static class RejectionReasonCode
{
    public const string BlurryImage = "blurry_image";
    public const string WrongAmount = "wrong_amount";
    public const string WrongAccount = "wrong_account";
    public const string ExpiredTimestamp = "expired_timestamp";
    public const string SuspiciousContent = "suspicious_content";
    public const string DuplicateSlip = "duplicate_slip";
    public const string Other = "other";

    public static string GetCustomerMessage(string code) => code switch
    {
        BlurryImage => "Your slip photo is not clear enough to verify. Please retake the photo in good lighting and reupload.",
        WrongAmount => "The amount on your slip does not match the order total. Please verify the transfer amount and reupload.",
        WrongAccount => "The recipient account on your slip does not match our payment account.",
        ExpiredTimestamp => "Your slip shows a transfer date that is more than 24 hours old. Please make a new transfer.",
        DuplicateSlip => "This slip has already been submitted.",
        _ => "We were unable to verify your payment slip. Please contact our support team.",
    };
}

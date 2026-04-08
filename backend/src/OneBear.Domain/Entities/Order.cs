namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;
using OneBear.Domain.Common;

public class Order : MongoEntity, IAuditableEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = default!;

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = default!; // e.g. "ORD-2026-001"

    [JsonPropertyName("customerId")]
    public string? CustomerId { get; set; }

    [JsonPropertyName("customerName")]
    public string? CustomerName { get; set; }

    [JsonPropertyName("roomId")]
    public string? RoomId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = OrderStatus.New;

    [JsonPropertyName("source")]
    public string Source { get; set; } = "agent"; // "agent" | "ai"

    [JsonPropertyName("items")]
    public List<OrderLineItem> Items { get; set; } = new();

    [JsonPropertyName("subtotal")]
    public decimal Subtotal { get; set; }

    [JsonPropertyName("discount")]
    public decimal Discount { get; set; }

    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "THB";

    // Payment
    [JsonPropertyName("paymentMode")]
    public string PaymentMode { get; set; } = "full"; // "full" | "deposit"

    [JsonPropertyName("paymentLink")]
    public PaymentLink? PaymentLink { get; set; }

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("paidTimestamp")]
    public long? PaidTimestamp { get; set; }

    // Deposit & Installments
    [JsonPropertyName("depositPercent")]
    public int? DepositPercent { get; set; }

    [JsonPropertyName("installmentCount")]
    public int? InstallmentCount { get; set; }

    [JsonPropertyName("installments")]
    public List<Installment> Installments { get; set; } = new();

    // Stock soft-hold
    [JsonPropertyName("softHoldExpiresAt")]
    public long? SoftHoldExpiresAt { get; set; }

    [JsonPropertyName("stockDeducted")]
    public bool StockDeducted { get; set; }

    // AI-specific
    [JsonPropertyName("aiClosed")]
    public bool AiClosed { get; set; }

    [JsonPropertyName("assignedToUserId")]
    public string? AssignedToUserId { get; set; }

    // Notes
    [JsonPropertyName("internalNote")]
    public string? InternalNote { get; set; }

    [JsonPropertyName("cancellationReason")]
    public string? CancellationReason { get; set; }

    // Audit
    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }

    [JsonPropertyName("updatedBy")]
    public string? UpdatedBy { get; set; }

    [JsonPropertyName("updatedTimestamp")]
    public long? UpdatedTimestamp { get; set; }

    /// <summary>Check if status transition is valid.</summary>
    public bool CanTransitionTo(string newStatus)
    {
        return (Status, newStatus) switch
        {
            (OrderStatus.New, OrderStatus.InProgress) => true,
            (OrderStatus.New, OrderStatus.Cancelled) => true,
            (OrderStatus.InProgress, OrderStatus.PendingPayment) => true,
            (OrderStatus.InProgress, OrderStatus.Cancelled) => true,
            (OrderStatus.PendingPayment, OrderStatus.PendingVerify) => true,
            (OrderStatus.PendingPayment, OrderStatus.Cancelled) => true,
            (OrderStatus.PendingPayment, OrderStatus.PaymentExpired) => true,
            (OrderStatus.PendingVerify, OrderStatus.Completed) => true,
            (OrderStatus.PendingVerify, OrderStatus.PendingPayment) => true, // rejection
            (OrderStatus.PaymentExpired, OrderStatus.PendingPayment) => true, // resend link
            (OrderStatus.PaymentExpired, OrderStatus.Cancelled) => true,
            (OrderStatus.Completed, OrderStatus.Refunded) => true,
            _ => false
        };
    }
}

public class OrderLineItem
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = default!;

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = default!;

    [JsonPropertyName("variantId")]
    public string? VariantId { get; set; }

    [JsonPropertyName("variantLabel")]
    public string? VariantLabel { get; set; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; } = 1;

    [JsonPropertyName("unitPrice")]
    public decimal UnitPrice { get; set; }

    [JsonPropertyName("lineTotal")]
    public decimal LineTotal => UnitPrice * Quantity;
}

public class PaymentLink
{
    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("idempotencyKey")]
    public string IdempotencyKey { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Active"; // "Active" | "Expired" | "Completed" | "Failed"

    [JsonPropertyName("expiresAtTimestamp")]
    public long ExpiresAtTimestamp { get; set; }

    [JsonPropertyName("createdTimestamp")]
    public long CreatedTimestamp { get; set; }
}

public class Installment
{
    [JsonPropertyName("number")]
    public int Number { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("dueTimestamp")]
    public long DueTimestamp { get; set; }

    [JsonPropertyName("paidTimestamp")]
    public long? PaidTimestamp { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Pending"; // "Pending" | "Paid" | "Overdue" | "PartiallyPaid"

    [JsonPropertyName("paidAmount")]
    public decimal PaidAmount { get; set; }
}

public static class OrderStatus
{
    public const string New = "New";
    public const string InProgress = "InProgress";
    public const string PendingPayment = "PendingPayment";
    public const string PendingVerify = "PendingVerify";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string PaymentExpired = "PaymentExpired";
    public const string Refunded = "Refunded";
}

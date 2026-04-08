namespace OneBear.Application.Orders.DTOs;

using OneBear.Domain.Entities;

public record OrderDto
{
    public string Id { get; init; } = default!;
    public string OrderId { get; init; } = default!;
    public string? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public string? RoomId { get; init; }
    public string Status { get; init; } = default!;
    public string Source { get; init; } = default!;
    public List<OrderLineItemDto> Items { get; init; } = new();
    public decimal Subtotal { get; init; }
    public decimal Discount { get; init; }
    public decimal Total { get; init; }
    public string Currency { get; init; } = "THB";
    public string PaymentMode { get; init; } = "full";
    public PaymentLinkDto? PaymentLink { get; init; }
    public decimal PaidAmount { get; init; }
    public long? PaidTimestamp { get; init; }
    public bool AiClosed { get; init; }
    public string? AssignedToUserId { get; init; }
    public string? InternalNote { get; init; }
    public string? CancellationReason { get; init; }
    public long CreatedTimestamp { get; init; }
    public long? UpdatedTimestamp { get; init; }
}

public record OrderLineItemDto
{
    public string ProductId { get; init; } = default!;
    public string ProductName { get; init; } = default!;
    public string? VariantId { get; init; }
    public string? VariantLabel { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal LineTotal { get; init; }
}

public record PaymentLinkDto
{
    public string? Url { get; init; }
    public string Status { get; init; } = default!;
    public long ExpiresAtTimestamp { get; init; }
    public long CreatedTimestamp { get; init; }
}

public record CreateOrderRequest
{
    public string? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public string? RoomId { get; init; }
    public List<CreateOrderItemRequest> Items { get; init; } = new();
    public decimal Discount { get; init; }
    public string PaymentMode { get; init; } = "full";
    public string Source { get; init; } = "agent";
    public int? DepositPercent { get; init; }
    public int? InstallmentCount { get; init; }
}

public record CreateOrderItemRequest
{
    public string ProductId { get; init; } = default!;
    public string ProductName { get; init; } = default!;
    public string? VariantId { get; init; }
    public string? VariantLabel { get; init; }
    public int Quantity { get; init; } = 1;
    public decimal UnitPrice { get; init; }
}

public record UpdateOrderStatusRequest
{
    public string Status { get; init; } = default!;
    public string? InternalNote { get; init; }
    public string? CancellationReason { get; init; }
}

public record OrderSummaryDto
{
    public int TotalOrders { get; init; }
    public int NewOrders { get; init; }
    public int PendingPayment { get; init; }
    public int PendingVerify { get; init; }
    public int Completed { get; init; }
    public int Cancelled { get; init; }
    public decimal TodayRevenue { get; init; }
}

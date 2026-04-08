namespace OneBear.Application.Orders.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Orders.DTOs;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class OrderManagementService : IOrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly ILogger<OrderManagementService> _logger;

    private const int SoftHoldMinutes = 30;
    private const int DefaultPaymentLinkExpiryHours = 24;

    public OrderManagementService(IOrderRepository orderRepo, ILogger<OrderManagementService> logger)
    {
        _orderRepo = orderRepo;
        _logger = logger;
    }

    // ─── IOrderService (AI integration) ──────────────────────────────────────

    public async Task<Result<AiOrderResult>> CreateOrderAsync(CreateAiOrderCommand cmd, CancellationToken ct)
    {
        CreateOrderRequest request = new()
        {
            CustomerId = cmd.CustomerId,
            RoomId = cmd.RoomId,
            Source = cmd.Source,
            Items = cmd.Items.Select(i => new CreateOrderItemRequest
            {
                ProductId = i.ProductId,
                ProductName = i.Name,
                Quantity = i.Quantity,
                UnitPrice = i.Price,
            }).ToList()
        };

        Result<OrderDto> result = await CreateAsync(cmd.CompanyId, "ai-system", request, ct);
        if (result is Result<OrderDto>.Failure f)
            return new Result<AiOrderResult>.Failure(f.Error);

        OrderDto order = ((Result<OrderDto>.Success)result).Value;
        return new Result<AiOrderResult>.Success(new AiOrderResult
        {
            Id = order.Id,
            TotalAmount = order.Total,
            Status = order.Status,
            PaymentLinkUrl = order.PaymentLink?.Url,
        });
    }

    public async Task<Result<AiOrderResult>> RollbackOrderAsync(string orderId, string companyId, CancellationToken ct)
    {
        Result<OrderDto> result = await UpdateStatusAsync(orderId, companyId, "ai-system",
            new UpdateOrderStatusRequest { Status = OrderStatus.Cancelled, CancellationReason = "AI rollback" }, ct);

        if (result is Result<OrderDto>.Failure f)
            return new Result<AiOrderResult>.Failure(f.Error);

        OrderDto order = ((Result<OrderDto>.Success)result).Value;
        return new Result<AiOrderResult>.Success(new AiOrderResult
        {
            Id = order.Id,
            TotalAmount = order.Total,
            Status = order.Status,
        });
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    public async Task<Result<OrderDto>> GetByIdAsync(string id, string companyId, CancellationToken ct)
    {
        Order? order = await _orderRepo.GetByIdAsync(id, companyId, ct);
        if (order is null)
            return new Result<OrderDto>.Failure(new Error("ORDER_NOT_FOUND", "Order not found", ErrorType.NotFound));

        return new Result<OrderDto>.Success(MapToDto(order));
    }

    public async Task<(List<OrderDto> Items, string? ContinuationToken)> QueryAsync(
        string companyId, OrderQueryParams query, CancellationToken ct)
    {
        (List<Order> items, string? token) = await _orderRepo.QueryAsync(companyId, query, ct);
        return (items.Select(MapToDto).ToList(), token);
    }

    public async Task<OrderSummaryDto> GetSummaryAsync(string companyId, CancellationToken ct)
    {
        long todayStart = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero).ToUnixTimeMilliseconds();
        long todayEnd = todayStart + 86_400_000;

        int newOrders = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.New, ct);
        int pendingPayment = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.PendingPayment, ct);
        int pendingVerify = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.PendingVerify, ct);
        int completed = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.Completed, ct);
        int cancelled = await _orderRepo.GetCountByStatusAsync(companyId, OrderStatus.Cancelled, ct);
        decimal todayRevenue = await _orderRepo.GetRevenueAsync(companyId, todayStart, todayEnd, ct);

        return new OrderSummaryDto
        {
            TotalOrders = newOrders + pendingPayment + pendingVerify + completed + cancelled,
            NewOrders = newOrders,
            PendingPayment = pendingPayment,
            PendingVerify = pendingVerify,
            Completed = completed,
            Cancelled = cancelled,
            TodayRevenue = todayRevenue,
        };
    }

    public async Task<Result<OrderDto>> CreateAsync(
        string companyId, string userId, CreateOrderRequest request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
            return new Result<OrderDto>.Failure(new Error("NO_ITEMS", "Order must have at least one item", ErrorType.Validation));

        int seq = await _orderRepo.GetNextSequenceAsync(companyId, ct);
        string orderId = $"ORD-{DateTime.UtcNow:yyyy}-{seq:D6}";
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        decimal subtotal = request.Items.Sum(i => i.UnitPrice * i.Quantity);
        decimal total = subtotal - request.Discount;

        Order order = new()
        {
            CompanyId = companyId,
            OrderId = orderId,
            CustomerId = request.CustomerId,
            CustomerName = request.CustomerName,
            RoomId = request.RoomId,
            Status = OrderStatus.New,
            Source = request.Source,
            Items = request.Items.Select(i => new OrderLineItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                VariantId = i.VariantId,
                VariantLabel = i.VariantLabel,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
            }).ToList(),
            Subtotal = subtotal,
            Discount = request.Discount,
            Total = total,
            PaymentMode = request.PaymentMode,
            DepositPercent = request.DepositPercent,
            InstallmentCount = request.InstallmentCount,
            AiClosed = request.Source == "ai",
            SoftHoldExpiresAt = now + (SoftHoldMinutes * 60 * 1000),
            CreatedBy = userId,
        };

        // Generate payment link placeholder
        order.PaymentLink = new PaymentLink
        {
            IdempotencyKey = Guid.NewGuid().ToString(),
            Status = "Active",
            ExpiresAtTimestamp = now + (DefaultPaymentLinkExpiryHours * 3600 * 1000),
            CreatedTimestamp = now,
        };

        Order created = await _orderRepo.CreateAsync(order, ct);
        _logger.LogInformation("Order {OrderId} created for company {CompanyId} by {UserId}", orderId, companyId, userId);
        return new Result<OrderDto>.Success(MapToDto(created));
    }

    public async Task<Result<OrderDto>> UpdateStatusAsync(
        string id, string companyId, string userId, UpdateOrderStatusRequest request, CancellationToken ct)
    {
        Order? order = await _orderRepo.GetByIdAsync(id, companyId, ct);
        if (order is null)
            return new Result<OrderDto>.Failure(new Error("ORDER_NOT_FOUND", "Order not found", ErrorType.NotFound));

        if (!order.CanTransitionTo(request.Status))
            return new Result<OrderDto>.Failure(new Error("INVALID_TRANSITION",
                $"Cannot transition from {order.Status} to {request.Status}", ErrorType.Validation));

        string oldStatus = order.Status;
        order.Status = request.Status;
        order.UpdatedBy = userId;

        if (request.InternalNote is not null)
            order.InternalNote = request.InternalNote;

        if (request.CancellationReason is not null)
            order.CancellationReason = request.CancellationReason;

        // Handle status-specific logic
        if (request.Status == OrderStatus.Completed)
        {
            order.PaidTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            order.PaidAmount = order.Total;
            order.StockDeducted = true;
            if (order.PaymentLink is not null) order.PaymentLink.Status = "Completed";
        }
        else if (request.Status == OrderStatus.Cancelled || request.Status == OrderStatus.PaymentExpired)
        {
            order.SoftHoldExpiresAt = null; // release soft-hold
            if (request.Status == OrderStatus.PaymentExpired && order.PaymentLink is not null)
                order.PaymentLink.Status = "Expired";
        }
        else if (request.Status == OrderStatus.PendingPayment && oldStatus == OrderStatus.PaymentExpired)
        {
            // Resend link — generate new payment link
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            order.PaymentLink = new PaymentLink
            {
                IdempotencyKey = Guid.NewGuid().ToString(),
                Status = "Active",
                ExpiresAtTimestamp = now + (DefaultPaymentLinkExpiryHours * 3600 * 1000),
                CreatedTimestamp = now,
            };
        }

        Order updated = await _orderRepo.UpdateAsync(order, ct);
        _logger.LogInformation("Order {OrderId} status changed: {Old} → {New} by {UserId}",
            order.OrderId, oldStatus, request.Status, userId);
        return new Result<OrderDto>.Success(MapToDto(updated));
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private static OrderDto MapToDto(Order o) => new()
    {
        Id = o.Id,
        OrderId = o.OrderId,
        CustomerId = o.CustomerId,
        CustomerName = o.CustomerName,
        RoomId = o.RoomId,
        Status = o.Status,
        Source = o.Source,
        Items = o.Items.Select(i => new OrderLineItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            VariantId = i.VariantId,
            VariantLabel = i.VariantLabel,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            LineTotal = i.LineTotal,
        }).ToList(),
        Subtotal = o.Subtotal,
        Discount = o.Discount,
        Total = o.Total,
        Currency = o.Currency,
        PaymentMode = o.PaymentMode,
        PaymentLink = o.PaymentLink is not null ? new PaymentLinkDto
        {
            Url = o.PaymentLink.Url,
            Status = o.PaymentLink.Status,
            ExpiresAtTimestamp = o.PaymentLink.ExpiresAtTimestamp,
            CreatedTimestamp = o.PaymentLink.CreatedTimestamp,
        } : null,
        PaidAmount = o.PaidAmount,
        PaidTimestamp = o.PaidTimestamp,
        AiClosed = o.AiClosed,
        AssignedToUserId = o.AssignedToUserId,
        InternalNote = o.InternalNote,
        CancellationReason = o.CancellationReason,
        CreatedTimestamp = o.CreatedTimestamp,
        UpdatedTimestamp = o.UpdatedTimestamp,
    };
}

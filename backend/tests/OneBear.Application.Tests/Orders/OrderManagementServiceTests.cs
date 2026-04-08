namespace OneBear.Application.Tests.Orders;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Orders.DTOs;
using OneBear.Application.Orders.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;

public class OrderManagementServiceTests
{
    private readonly Mock<IOrderRepository> _repoMock;
    private readonly Mock<ILogger<OrderManagementService>> _loggerMock;
    private readonly OrderManagementService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public OrderManagementServiceTests()
    {
        _repoMock = new Mock<IOrderRepository>();
        _loggerMock = new Mock<ILogger<OrderManagementService>>();

        _repoMock.Setup(r => r.CreateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        _repoMock.Setup(r => r.UpdateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        _repoMock.Setup(r => r.GetNextSequenceAsync(CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _sut = new OrderManagementService(_repoMock.Object, _loggerMock.Object);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ShouldSucceed_WithValidItems()
    {
        CreateOrderRequest request = new()
        {
            CustomerName = "Jane",
            Items = new()
            {
                new() { ProductId = "p1", ProductName = "T-Shirt", Quantity = 2, UnitPrice = 199 },
                new() { ProductId = "p2", ProductName = "Shorts", Quantity = 1, UnitPrice = 249 },
            }
        };

        Result<OrderDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Success>(result);
        OrderDto order = ((Result<OrderDto>.Success)result).Value;
        Assert.Equal(OrderStatus.New, order.Status);
        Assert.Equal(647, order.Total); // 199*2 + 249
        Assert.Equal(647, order.Subtotal);
        Assert.Equal(2, order.Items.Count);
        Assert.StartsWith("ORD-", order.OrderId);
        Assert.NotNull(order.PaymentLink);
        Assert.Equal("Active", order.PaymentLink!.Status);
    }

    [Fact]
    public async Task Create_ShouldFail_WithNoItems()
    {
        CreateOrderRequest request = new()
        {
            CustomerName = "Jane",
            Items = new()
        };

        Result<OrderDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Failure>(result);
        Assert.Equal("NO_ITEMS", ((Result<OrderDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Create_ShouldApplyDiscount()
    {
        CreateOrderRequest request = new()
        {
            Items = new() { new() { ProductId = "p1", ProductName = "A", Quantity = 1, UnitPrice = 500 } },
            Discount = 50
        };

        Result<OrderDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        OrderDto order = ((Result<OrderDto>.Success)result).Value;
        Assert.Equal(500, order.Subtotal);
        Assert.Equal(50, order.Discount);
        Assert.Equal(450, order.Total);
    }

    [Fact]
    public async Task Create_ShouldSetAiClosed_WhenSourceIsAi()
    {
        CreateOrderRequest request = new()
        {
            Items = new() { new() { ProductId = "p1", ProductName = "A", Quantity = 1, UnitPrice = 100 } },
            Source = "ai"
        };

        Result<OrderDto> result = await _sut.CreateAsync(CompanyId, UserId, request, CancellationToken.None);

        OrderDto order = ((Result<OrderDto>.Success)result).Value;
        Assert.True(order.AiClosed);
        Assert.Equal("ai", order.Source);
    }

    // ─── Status Transitions ──────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_ShouldTransition_NewToInProgress()
    {
        Order order = CreateOrder("ord-1", OrderStatus.New);
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        Result<OrderDto> result = await _sut.UpdateStatusAsync("ord-1", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.InProgress }, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Success>(result);
        Assert.Equal(OrderStatus.InProgress, ((Result<OrderDto>.Success)result).Value.Status);
    }

    [Fact]
    public async Task UpdateStatus_ShouldReject_InvalidTransition()
    {
        Order order = CreateOrder("ord-1", OrderStatus.New);
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        Result<OrderDto> result = await _sut.UpdateStatusAsync("ord-1", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.Completed }, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Failure>(result);
        Assert.Equal("INVALID_TRANSITION", ((Result<OrderDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task UpdateStatus_ShouldReturnNotFound_WhenOrderMissing()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        Result<OrderDto> result = await _sut.UpdateStatusAsync("missing", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.InProgress }, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Failure>(result);
        Assert.Equal("ORDER_NOT_FOUND", ((Result<OrderDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task UpdateStatus_ShouldSetPaidFields_WhenCompleted()
    {
        Order order = CreateOrder("ord-1", OrderStatus.PendingVerify);
        order.Total = 1000;
        order.PaymentLink = new PaymentLink { Status = "Active" };
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        Result<OrderDto> result = await _sut.UpdateStatusAsync("ord-1", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.Completed }, CancellationToken.None);

        OrderDto dto = ((Result<OrderDto>.Success)result).Value;
        Assert.Equal(OrderStatus.Completed, dto.Status);
        Assert.Equal(1000, dto.PaidAmount);
        Assert.NotNull(dto.PaidTimestamp);
        Assert.Equal("Completed", dto.PaymentLink!.Status);
    }

    [Fact]
    public async Task UpdateStatus_ShouldReleaseSoftHold_WhenCancelled()
    {
        Order order = CreateOrder("ord-1", OrderStatus.New);
        order.SoftHoldExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeMilliseconds();
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        await _sut.UpdateStatusAsync("ord-1", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.Cancelled, CancellationReason = "Test" }, CancellationToken.None);

        _repoMock.Verify(r => r.UpdateAsync(It.Is<Order>(o =>
            o.SoftHoldExpiresAt == null && o.CancellationReason == "Test"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatus_ShouldGenerateNewPaymentLink_WhenResendFromExpired()
    {
        Order order = CreateOrder("ord-1", OrderStatus.PaymentExpired);
        order.PaymentLink = new PaymentLink { Status = "Expired" };
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        Result<OrderDto> result = await _sut.UpdateStatusAsync("ord-1", CompanyId, UserId,
            new UpdateOrderStatusRequest { Status = OrderStatus.PendingPayment }, CancellationToken.None);

        OrderDto dto = ((Result<OrderDto>.Success)result).Value;
        Assert.Equal(OrderStatus.PendingPayment, dto.Status);
        Assert.Equal("Active", dto.PaymentLink!.Status);
        Assert.True(dto.PaymentLink.ExpiresAtTimestamp > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
    }

    // ─── AI Integration ──────────────────────────────────────────────────────

    [Fact]
    public async Task CreateOrderAsync_ShouldWork_ForAiOrders()
    {
        CreateAiOrderCommand cmd = new()
        {
            CompanyId = CompanyId,
            RoomId = "room-1",
            CustomerId = "cust-1",
            Source = "ai",
            Items = new()
            {
                new AiOrderItem { ProductId = "p1", Name = "Shirt", Price = 199, Quantity = 1 }
            }
        };

        Result<AiOrderResult> result = await _sut.CreateOrderAsync(cmd, CancellationToken.None);

        Assert.IsType<Result<AiOrderResult>.Success>(result);
        AiOrderResult aiResult = ((Result<AiOrderResult>.Success)result).Value;
        Assert.Equal(199, aiResult.TotalAmount);
        Assert.Equal(OrderStatus.New, aiResult.Status);
    }

    // ─── GetById ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_ShouldReturnOrder_WhenExists()
    {
        Order order = CreateOrder("ord-1", OrderStatus.New);
        _repoMock.Setup(r => r.GetByIdAsync("ord-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        Result<OrderDto> result = await _sut.GetByIdAsync("ord-1", CompanyId, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Success>(result);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenMissing()
    {
        _repoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        Result<OrderDto> result = await _sut.GetByIdAsync("missing", CompanyId, CancellationToken.None);

        Assert.IsType<Result<OrderDto>.Failure>(result);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static Order CreateOrder(string id, string status)
    {
        return new Order
        {
            Id = id,
            CompanyId = CompanyId,
            OrderId = $"ORD-2026-{id}",
            Status = status,
            Total = 500,
            Subtotal = 500,
            Items = new() { new OrderLineItem { ProductId = "p1", ProductName = "Test", Quantity = 1, UnitPrice = 500 } },
            CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        };
    }
}

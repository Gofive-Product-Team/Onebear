namespace OneBear.Domain.Tests.Entities;

using OneBear.Domain.Entities;

public class OrderTests
{
    [Theory]
    [InlineData(OrderStatus.New, OrderStatus.InProgress, true)]
    [InlineData(OrderStatus.New, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.InProgress, OrderStatus.PendingPayment, true)]
    [InlineData(OrderStatus.InProgress, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.PendingVerify, true)]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.PaymentExpired, true)]
    [InlineData(OrderStatus.PendingVerify, OrderStatus.Completed, true)]
    [InlineData(OrderStatus.PendingVerify, OrderStatus.PendingPayment, true)]
    [InlineData(OrderStatus.PaymentExpired, OrderStatus.PendingPayment, true)]
    [InlineData(OrderStatus.PaymentExpired, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.Completed, OrderStatus.Refunded, true)]
    public void CanTransitionTo_ShouldReturnTrue_ForValidTransitions(string from, string to, bool expected)
    {
        Order order = new() { Status = from };
        Assert.Equal(expected, order.CanTransitionTo(to));
    }

    [Theory]
    [InlineData(OrderStatus.New, OrderStatus.Completed)]
    [InlineData(OrderStatus.New, OrderStatus.PendingPayment)]
    [InlineData(OrderStatus.InProgress, OrderStatus.Completed)]
    [InlineData(OrderStatus.Completed, OrderStatus.New)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.New)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Completed)]
    [InlineData(OrderStatus.Refunded, OrderStatus.Completed)]
    [InlineData(OrderStatus.PendingVerify, OrderStatus.Cancelled)]
    public void CanTransitionTo_ShouldReturnFalse_ForInvalidTransitions(string from, string to)
    {
        Order order = new() { Status = from };
        Assert.False(order.CanTransitionTo(to));
    }

    [Fact]
    public void LineItem_LineTotal_ShouldMultiplyPriceByQuantity()
    {
        OrderLineItem item = new() { UnitPrice = 199, Quantity = 3 };
        Assert.Equal(597, item.LineTotal);
    }

    [Fact]
    public void NewOrder_ShouldHaveDefaultValues()
    {
        Order order = new();
        Assert.Equal(OrderStatus.New, order.Status);
        Assert.Equal("agent", order.Source);
        Assert.Equal("full", order.PaymentMode);
        Assert.Equal("THB", order.Currency);
        Assert.False(order.AiClosed);
        Assert.False(order.StockDeducted);
        Assert.Empty(order.Items);
        Assert.Empty(order.Installments);
    }
}

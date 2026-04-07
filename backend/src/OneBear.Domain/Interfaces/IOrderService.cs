namespace OneBear.Domain.Interfaces;

using OneBear.Domain.Common;

public interface IOrderService
{
    Task<Result<AiOrderResult>> CreateOrderAsync(CreateAiOrderCommand cmd, CancellationToken ct);
    Task<Result<AiOrderResult>> RollbackOrderAsync(string orderId, string companyId, CancellationToken ct);
}

public class CreateAiOrderCommand
{
    public string CompanyId { get; set; } = "";
    public string RoomId { get; set; } = "";
    public string CustomerId { get; set; } = "";
    public List<AiOrderItem> Items { get; set; } = new();
    public string Source { get; set; } = "ai";
}

public class AiOrderItem
{
    public string ProductId { get; set; } = "";
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Quantity { get; set; } = 1;
}

public class AiOrderResult
{
    public string Id { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "pending";
    public string? PaymentLinkUrl { get; set; }
}

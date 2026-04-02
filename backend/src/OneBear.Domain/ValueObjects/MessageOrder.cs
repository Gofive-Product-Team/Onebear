namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class MessageOrder
{
    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = default!;

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("totalAmount")]
    public decimal? TotalAmount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("items")]
    public List<OrderItem>? Items { get; set; }
}

namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class OrderItem
{
    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;

    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    [JsonPropertyName("price")]
    public decimal Price { get; set; }
}

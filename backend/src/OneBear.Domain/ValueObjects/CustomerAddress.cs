namespace OneBear.Domain.ValueObjects;

using System.Text.Json.Serialization;

public class CustomerAddress
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("label")]
    public string Label { get; set; } = ""; // "Home", "Work", "Shipping", etc.

    [JsonPropertyName("address")]
    public string Address { get; set; } = ""; // Street address, house number

    [JsonPropertyName("subDistrict")]
    public string? SubDistrict { get; set; } // แขวง/ตำบล

    [JsonPropertyName("district")]
    public string? District { get; set; } // เขต/อำเภอ

    [JsonPropertyName("province")]
    public string? Province { get; set; } // จังหวัด

    [JsonPropertyName("postalCode")]
    public string? PostalCode { get; set; }

    [JsonPropertyName("country")]
    public string Country { get; set; } = "Thailand";

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("note")]
    public string? Note { get; set; } // เช่น "ประตูสีแดง ชั้น 3"
}

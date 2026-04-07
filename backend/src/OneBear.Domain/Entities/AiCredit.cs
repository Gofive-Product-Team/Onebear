namespace OneBear.Domain.Entities;

using System.Text.Json.Serialization;

public class AiCredit : MongoEntity
{
    [JsonPropertyName("companyId")]
    public string CompanyId { get; set; } = "";

    [JsonPropertyName("creditLimit")]
    public int CreditLimit { get; set; }

    [JsonPropertyName("creditUsed")]
    public int CreditUsed { get; set; }

    [JsonPropertyName("planId")]
    public string PlanId { get; set; } = "free";

    [JsonPropertyName("resetTimestamp")]
    public long? ResetTimestamp { get; set; }

    [JsonPropertyName("lastDeductTimestamp")]
    public long? LastDeductTimestamp { get; set; }
}

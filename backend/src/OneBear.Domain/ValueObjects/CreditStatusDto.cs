namespace OneBear.Domain.ValueObjects;

using OneBear.Domain.Enums;

public class CreditStatusDto
{
    public int CreditLimit { get; set; }
    public int CreditUsed { get; set; }
    public int CreditRemaining => CreditLimit - CreditUsed;
    public string PlanId { get; set; } = "";
    public CreditWarningLevel Warning { get; set; }
}

namespace OneBear.Domain.Enums;

public static class UserType
{
    public const string Customer = "Customer";
    public const string Agent = "Agent";
    public const string Bot = "Bot";

    public static readonly string[] All = [Customer, Agent, Bot];
}

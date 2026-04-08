namespace OneBear.Application.Followup.DTOs;

public record FollowupConfigDto
{
    public string Id { get; init; } = default!;
    public List<FollowupChannelRuleDto> ChannelRules { get; init; } = new();
    public long? UpdatedTimestamp { get; init; }
}

public record FollowupChannelRuleDto
{
    public string Platform { get; init; } = default!;
    public bool Enabled { get; init; }
    public string SendWindowStart { get; init; } = "09:00";
    public string SendWindowEnd { get; init; } = "21:00";
    public int TriggerDelayHours { get; init; } = 2;
    public int MaxAttempts { get; init; } = 2;
    public int DebounceHours { get; init; } = 4;
    public List<FollowupAttemptDto> Attempts { get; init; } = new();
}

public record FollowupAttemptDto
{
    public int Number { get; init; }
    public int DelayHours { get; init; }
    public string MessageTemplate { get; init; } = "";
}

public record UpdateFollowupConfigRequest
{
    public List<FollowupChannelRuleDto> ChannelRules { get; init; } = new();
}

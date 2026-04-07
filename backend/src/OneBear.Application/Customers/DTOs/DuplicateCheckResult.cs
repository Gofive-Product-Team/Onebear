namespace OneBear.Application.Customers.DTOs;

public record DuplicateCheckResult
{
    public bool HasDuplicate { get; init; }
    public List<DuplicateMatchDto> Matches { get; init; } = new();
}

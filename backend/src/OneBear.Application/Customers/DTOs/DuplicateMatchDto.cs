namespace OneBear.Application.Customers.DTOs;

public record DuplicateMatchDto
{
    public string Id { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string? Phone { get; init; }
    public string? Email { get; init; }

    /// <summary>The field that triggered the match: "taxId", "nationalId", "phone", "email", "name".</summary>
    public string MatchedField { get; init; } = default!;
}

namespace OneBear.Application.Customers.Mappings;

using OneBear.Application.Customers.DTOs;
using OneBear.Domain.Entities;
using OneBear.Domain.ValueObjects;

public static class CustomerMapper
{
    // Tag priority: Hot=1, At-risk=2, VIP=3, Loyal=4, Cold=5, New=6, other=99
    private static readonly Dictionary<string, int> TagPriority = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Hot"] = 1,
        ["At-risk"] = 2,
        ["VIP"] = 3,
        ["Loyal"] = 4,
        ["Cold"] = 5,
        ["New"] = 6
    };

    public static CustomerListDto ToListDto(Customer customer)
    {
        List<CustomerTagDto> tags = MapTagsSorted(customer.Tags, maxTags: 2);
        bool isAtRisk = customer.Tags.Any(t => string.Equals(t.Name, "At-risk", StringComparison.OrdinalIgnoreCase));
        int? daysSinceLastPurchase = ComputeDaysSinceLastPurchase(customer.LastOrderTimestamp);

        return new CustomerListDto
        {
            Id = customer.Id,
            CustomerType = customer.CustomerType,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Avatar = customer.Avatar,
            Channels = customer.Channels.Select(MapChannel).ToList(),
            Tags = tags,
            Ltv = customer.Ltv,
            OrderCount = customer.OrderCount,
            Aov = customer.Aov,
            LastOrderTimestamp = customer.LastOrderTimestamp,
            LastActivityTimestamp = customer.LastActivityTimestamp,
            LastMessagePreview = null, // Populated by service if needed
            PinnedNote = customer.PinnedNote,
            IsAtRisk = isAtRisk,
            DaysSinceLastPurchase = daysSinceLastPurchase,
            SuggestedAction = ComputeSuggestedAction(customer),
            SuggestedActionType = ComputeSuggestedActionType(customer)
        };
    }

    public static CustomerDetailDto ToDetailDto(Customer customer)
    {
        List<CustomerTagDto> tags = MapTagsSorted(customer.Tags, maxTags: int.MaxValue);
        bool isAtRisk = customer.Tags.Any(t => string.Equals(t.Name, "At-risk", StringComparison.OrdinalIgnoreCase));
        int? daysSinceLastPurchase = ComputeDaysSinceLastPurchase(customer.LastOrderTimestamp);

        return new CustomerDetailDto
        {
            Id = customer.Id,
            CustomerType = customer.CustomerType,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Avatar = customer.Avatar,
            Addresses = customer.Addresses ?? new(),
            Channels = customer.Channels.Select(MapChannel).ToList(),
            Tags = tags,
            Ltv = customer.Ltv,
            OrderCount = customer.OrderCount,
            Aov = customer.Aov,
            LastOrderTimestamp = customer.LastOrderTimestamp,
            LastActivityTimestamp = customer.LastActivityTimestamp,
            LastMessagePreview = null,
            PinnedNote = customer.PinnedNote,
            IsAtRisk = isAtRisk,
            DaysSinceLastPurchase = daysSinceLastPurchase,
            NationalId = customer.NationalId,
            TaxId = customer.TaxId,
            PinnedNoteBy = customer.PinnedNoteBy,
            PinnedNoteTimestamp = customer.PinnedNoteTimestamp,
            OrganizationId = customer.OrganizationId,
            ContactIds = customer.ContactIds,
            IsPromoted = customer.IsPromoted,
            PromotedTimestamp = customer.PromotedTimestamp,
            CreatedTimestamp = customer.CreatedTimestamp,
            UpdatedTimestamp = customer.UpdatedTimestamp
        };
    }

    private static List<CustomerTagDto> MapTagsSorted(List<CustomerTag> tags, int maxTags)
    {
        return tags
            .OrderBy(t => TagPriority.TryGetValue(t.Name, out int p) ? p : 99)
            .Take(maxTags)
            .Select(t => new CustomerTagDto
            {
                Name = t.Name,
                IsAiAssigned = t.IsAiAssigned,
                Reason = t.Reason
            })
            .ToList();
    }

    private static CustomerChannelDto MapChannel(CustomerChannel channel)
        => new()
        {
            Platform = channel.Platform,
            DisplayName = channel.DisplayName
        };

    private static int? ComputeDaysSinceLastPurchase(long? lastOrderTimestamp)
    {
        if (lastOrderTimestamp is null) return null;
        long nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        long diffMs = nowMs - lastOrderTimestamp.Value;
        if (diffMs < 0) return 0;
        return (int)(diffMs / 86400000L);
    }

    private static string? ComputeSuggestedAction(Customer c)
    {
        bool isHot = c.Tags.Any(t => t.Name == "Hot");
        bool isAtRisk = c.Tags.Any(t => t.Name == "At-risk");
        bool isNew = c.Tags.Any(t => t.Name == "New");
        bool wasVip = c.Tags.Any(t => t.Name == "VIP");

        if (isHot) return "Send a thank you message";
        if (isAtRisk && wasVip) return "Win them back with a special offer";
        if (isAtRisk) return "Check in on their experience";
        if (isNew && c.OrderCount == 0) return "Welcome and introduce products";
        return null;
    }

    private static string? ComputeSuggestedActionType(Customer c)
    {
        bool isHot = c.Tags.Any(t => t.Name == "Hot");
        bool isAtRisk = c.Tags.Any(t => t.Name == "At-risk");
        bool isNew = c.Tags.Any(t => t.Name == "New");

        if (isHot) return "chat";
        if (isAtRisk) return "followup";
        if (isNew && c.OrderCount == 0) return "welcome";
        return null;
    }
}

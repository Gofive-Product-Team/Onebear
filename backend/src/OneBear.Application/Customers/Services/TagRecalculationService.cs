namespace OneBear.Application.Customers.Services;

using OneBear.Domain.Entities;
using OneBear.Domain.ValueObjects;

/// <summary>
/// Evaluates AI tag rules against a customer and returns the updated customer.
/// Does NOT persist — caller is responsible for saving.
/// </summary>
public class TagRecalculationService
{
    private const decimal VipThreshold = 5000m;
    private static readonly string[] AiTagNames =
    [
        "New", "Hot", "VIP", "At-risk", "Cold", "Loyal", "Organization"
    ];

    // ── Public API ─────────────────────────────────────────────────────

    public Customer RecalculateTagsAsync(Customer customer)
    {
        long nowMs = NowMs();

        // Desired state per rule
        bool shouldBeNew = IsWithinDays(customer.CreatedTimestamp, 7);
        bool shouldBeHot = IsWithinDays(customer.LastActivityTimestamp, 2);
        bool shouldBeVip = customer.Ltv >= VipThreshold;
        bool shouldBeAtRisk = customer.OrderCount > 0 && IsOlderThanDays(customer.LastActivityTimestamp, 30);
        bool shouldBeCold = IsOlderThanDays(customer.LastActivityTimestamp, 60);
        bool shouldBeLoyalAdd = customer.OrderCount >= 3; // permanent once earned
        bool shouldBeOrganization = string.Equals(customer.CustomerType, "Organization", StringComparison.OrdinalIgnoreCase);

        Dictionary<string, (bool Should, string Reason)> rules = new(StringComparer.OrdinalIgnoreCase)
        {
            ["New"] = (shouldBeNew, "Customer was created within the last 7 days"),
            ["Hot"] = (shouldBeHot, "Customer had activity within the last 48 hours"),
            ["VIP"] = (shouldBeVip, $"Lifetime value >= {VipThreshold:N0}"),
            ["At-risk"] = (shouldBeAtRisk, "Has ordered before but no activity for 30+ days"),
            ["Cold"] = (shouldBeCold, "No activity for 60+ days"),
            ["Loyal"] = (shouldBeLoyalAdd, "Customer has placed 3 or more orders"),
            ["Organization"] = (shouldBeOrganization, "Customer type is Organization")
        };

        List<CustomerTag> currentTags = customer.Tags;

        foreach ((string tagName, (bool shouldExist, string reason)) in rules)
        {
            CustomerTag? existingTag = currentTags.Find(t =>
                string.Equals(t.Name, tagName, StringComparison.OrdinalIgnoreCase));

            bool exists = existingTag is not null;

            if (shouldExist && !exists)
            {
                // Add tag
                currentTags.Add(new CustomerTag
                {
                    Name = tagName,
                    IsAiAssigned = true,
                    Reason = reason,
                    AssignedBy = "ai",
                    AssignedTimestamp = nowMs
                });
            }
            else if (!shouldExist && exists && existingTag!.IsAiAssigned)
            {
                // Remove AI-assigned tag only
                currentTags.RemoveAll(t =>
                    string.Equals(t.Name, tagName, StringComparison.OrdinalIgnoreCase) && t.IsAiAssigned);
            }
            // Manual tags (IsAiAssigned=false) are never removed by AI
        }

        customer.Tags = currentTags;
        return customer;
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>Returns true if the timestamp is set and within the last N days.</summary>
    private static bool IsWithinDays(long? timestampMs, int days)
    {
        if (timestampMs is null) return false;
        long cutoffMs = NowMs() - (long)days * 86400000L;
        return timestampMs.Value >= cutoffMs;
    }

    // Overload for non-nullable (CreatedTimestamp)
    private static bool IsWithinDays(long timestampMs, int days)
    {
        long cutoffMs = NowMs() - (long)days * 86400000L;
        return timestampMs >= cutoffMs;
    }

    /// <summary>Returns true if the timestamp is set and older than N days.</summary>
    private static bool IsOlderThanDays(long? timestampMs, int days)
    {
        if (timestampMs is null) return false;
        long cutoffMs = NowMs() - (long)days * 86400000L;
        return timestampMs.Value < cutoffMs;
    }
}

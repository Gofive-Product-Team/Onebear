namespace OneBear.Application.Messaging;

public class SpamDetectionService
{
    private static readonly string[] SpamKeywords =
    {
        "click here", "free money", "congratulations you won",
        "act now", "limited time offer", "buy now",
        "earn money fast", "no credit check", "winner",
        "casino", "lottery", "prize claim"
    };

    /// <summary>
    /// Checks whether the given content is spam based on keyword matching.
    /// Returns (isSpam, score) where score is 0.0–1.0.
    /// A score >= 0.9 is considered high-confidence spam.
    /// </summary>
    public (bool IsSpam, double Score) CheckMessage(string? content)
    {
        if (string.IsNullOrEmpty(content))
            return (false, 0);

        string lower = content.ToLowerInvariant();
        int matches = SpamKeywords.Count(kw => lower.Contains(kw));
        double score = Math.Min(1.0, matches * 0.25);
        bool isSpam = score >= 0.9;
        return (isSpam, score);
    }
}

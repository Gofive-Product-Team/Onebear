namespace OneBear.Domain.Enums;

/// <summary>String constants for chat room states.</summary>
public static class ChatState
{
    public const string New = "New";
    public const string InProgress = "InProgress";
    public const string Closed = "Closed";
    public const string Resolved = "Resolved";
    public const string Spam = "Spam";

    public static readonly string[] All = [New, InProgress, Closed, Resolved, Spam];
}

namespace OneBear.Application.Common;

public static class DateTimeHelper
{
    public static long ToUnixMilliseconds(this DateTimeOffset dt) => dt.ToUnixTimeMilliseconds();
    public static long NowUnixMilliseconds() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public static DateTimeOffset FromUnixMilliseconds(long ms) =>
        DateTimeOffset.FromUnixTimeMilliseconds(ms);

    public static string ToIso8601(this DateTimeOffset dt) => dt.ToString("o");

    public static DateTimeOffset? FromUnixMillisecondsNullable(long? ms) =>
        ms.HasValue ? DateTimeOffset.FromUnixTimeMilliseconds(ms.Value) : null;
}

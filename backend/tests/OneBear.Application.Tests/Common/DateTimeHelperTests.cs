using OneBear.Application.Common;

namespace OneBear.Application.Tests.Common;

public class DateTimeHelperTests
{
    [Fact]
    public void ToUnixMilliseconds_ShouldRoundTrip()
    {
        // Arrange
        DateTimeOffset original = new DateTimeOffset(2025, 6, 15, 12, 30, 0, TimeSpan.Zero);

        // Act
        long ms = original.ToUnixMilliseconds();
        DateTimeOffset restored = DateTimeHelper.FromUnixMilliseconds(ms);

        // Assert
        Assert.Equal(original, restored);
    }

    [Fact]
    public void NowUnixMilliseconds_ShouldReturnPositiveValue()
    {
        // Act
        long ms = DateTimeHelper.NowUnixMilliseconds();

        // Assert
        Assert.True(ms > 0);
    }

    [Fact]
    public void FromUnixMilliseconds_ShouldReturnCorrectDate()
    {
        // Arrange — 2024-01-01T00:00:00Z = 1704067200000ms
        long ms = 1704067200000;

        // Act
        DateTimeOffset result = DateTimeHelper.FromUnixMilliseconds(ms);

        // Assert
        Assert.Equal(2024, result.Year);
        Assert.Equal(1, result.Month);
        Assert.Equal(1, result.Day);
        Assert.Equal(TimeSpan.Zero, result.Offset);
    }

    [Fact]
    public void ToIso8601_ShouldReturnIso8601Format()
    {
        // Arrange
        DateTimeOffset dt = new DateTimeOffset(2025, 3, 15, 10, 30, 0, TimeSpan.Zero);

        // Act
        string iso = dt.ToIso8601();

        // Assert
        Assert.Contains("2025-03-15", iso);
        Assert.Contains("10:30:00", iso);
    }

    [Fact]
    public void FromUnixMillisecondsNullable_ShouldReturnNull_WhenInputNull()
    {
        // Act
        DateTimeOffset? result = DateTimeHelper.FromUnixMillisecondsNullable(null);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void FromUnixMillisecondsNullable_ShouldReturnValue_WhenInputProvided()
    {
        // Arrange
        long ms = 1704067200000;

        // Act
        DateTimeOffset? result = DateTimeHelper.FromUnixMillisecondsNullable(ms);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2024, result!.Value.Year);
    }
}

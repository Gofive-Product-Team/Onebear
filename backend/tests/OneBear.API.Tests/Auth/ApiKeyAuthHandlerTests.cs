using OneBear.API.Auth;

namespace OneBear.API.Tests.Auth;

public class ApiKeyAuthHandlerTests
{
    [Fact]
    public void ConstantTimeEquals_ShouldReturnTrue_WhenStringsMatch()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("test-key-123", "test-key-123");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenStringsDiffer()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("test-key-123", "test-key-456");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenFirstStringIsNull()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals(null!, "test-key");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenSecondStringIsNull()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("test-key", null!);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenFirstStringIsEmpty()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("", "test-key");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenBothStringsAreEmpty()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("", "");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnFalse_WhenStringsHaveDifferentLengths()
    {
        // Arrange & Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals("short", "a-much-longer-key");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ConstantTimeEquals_ShouldReturnTrue_WhenComplexKeysMatch()
    {
        // Arrange
        string key = "dev-webhook-key-change-in-production";

        // Act
        bool result = ApiKeyAuthHandler.ConstantTimeEquals(key, key);

        // Assert
        Assert.True(result);
    }
}

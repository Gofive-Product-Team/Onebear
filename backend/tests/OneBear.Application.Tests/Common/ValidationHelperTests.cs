using OneBear.Application.Common;
using OneBear.Domain.Common;

namespace OneBear.Application.Tests.Common;

public class ValidationHelperTests
{
    [Fact]
    public void EnsureNotNull_ShouldReturnSuccess_WhenValueExists()
    {
        // Arrange
        string value = "test-object";

        // Act
        Result<string> result = ValidationHelper.EnsureNotNull(value, "Room", "123");

        // Assert
        Assert.IsType<Result<string>.Success>(result);
        Result<string>.Success success = (Result<string>.Success)result;
        Assert.Equal("test-object", success.Value);
    }

    [Fact]
    public void EnsureNotNull_ShouldReturnFailure_WhenValueIsNull()
    {
        // Act
        Result<string> result = ValidationHelper.EnsureNotNull<string>(null, "Room", "abc-123");

        // Assert
        Assert.IsType<Result<string>.Failure>(result);
        Result<string>.Failure failure = (Result<string>.Failure)result;
        Assert.Equal(ErrorType.NotFound, failure.Error.Type);
        Assert.Equal("ROOM_NOT_FOUND", failure.Error.Code);
        Assert.Contains("abc-123", failure.Error.Message);
    }

    [Fact]
    public void EnsureNotEmpty_ShouldReturnSuccess_WhenValueIsNotEmpty()
    {
        // Act
        Result<string> result = ValidationHelper.EnsureNotEmpty("hello", "Name");

        // Assert
        Assert.IsType<Result<string>.Success>(result);
        Result<string>.Success success = (Result<string>.Success)result;
        Assert.Equal("hello", success.Value);
    }

    [Fact]
    public void EnsureNotEmpty_ShouldReturnFailure_WhenValueIsNull()
    {
        // Act
        Result<string> result = ValidationHelper.EnsureNotEmpty(null, "Name");

        // Assert
        Assert.IsType<Result<string>.Failure>(result);
        Result<string>.Failure failure = (Result<string>.Failure)result;
        Assert.Equal(ErrorType.Validation, failure.Error.Type);
        Assert.Equal("VALIDATION_ERROR", failure.Error.Code);
        Assert.Contains("Name", failure.Error.Message);
    }

    [Fact]
    public void EnsureNotEmpty_ShouldReturnFailure_WhenValueIsWhitespace()
    {
        // Act
        Result<string> result = ValidationHelper.EnsureNotEmpty("   ", "Email");

        // Assert
        Assert.IsType<Result<string>.Failure>(result);
        Result<string>.Failure failure = (Result<string>.Failure)result;
        Assert.Equal(ErrorType.Validation, failure.Error.Type);
        Assert.Contains("Email", failure.Error.Message);
    }

    [Fact]
    public void EnsureNotEmpty_ShouldReturnFailure_WhenValueIsEmptyString()
    {
        // Act
        Result<string> result = ValidationHelper.EnsureNotEmpty(string.Empty, "CompanyId");

        // Assert
        Assert.IsType<Result<string>.Failure>(result);
        Result<string>.Failure failure = (Result<string>.Failure)result;
        Assert.Contains("CompanyId", failure.Error.Message);
    }
}

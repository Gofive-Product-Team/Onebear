using OneBear.Domain.Common;

namespace OneBear.Domain.Tests;

public class ResultTests
{
    [Fact]
    public void Success_ShouldHaveValue()
    {
        var result = new Result<string>.Success("hello");

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal("hello", result.Value);
    }

    [Fact]
    public void Failure_ShouldHaveError()
    {
        var error = new Error("NOT_FOUND", "Item not found", ErrorType.NotFound);
        var result = new Result<string>.Failure(error);

        Assert.True(result.IsFailure);
        Assert.False(result.IsSuccess);
        Assert.Equal("NOT_FOUND", result.Error.Code);
        Assert.Equal(ErrorType.NotFound, result.Error.Type);
    }
}

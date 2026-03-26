using Microsoft.AspNetCore.Mvc;
using OneBear.API.Extensions;
using OneBear.Domain.Common;

namespace OneBear.API.Tests.Extensions;

public class ResultExtensionsTests
{
    [Fact]
    public void ToActionResult_ShouldReturn200_WhenSuccess()
    {
        // Arrange
        Result<string> result = new Result<string>.Success("hello");

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        OkObjectResult okResult = Assert.IsType<OkObjectResult>(actionResult);
        Assert.Equal(200, okResult.StatusCode);
        Assert.Equal("hello", okResult.Value);
    }

    [Fact]
    public void ToActionResult_ShouldReturn400_WhenValidationError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("VALIDATION_ERROR", "Name is required.", ErrorType.Validation));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        BadRequestObjectResult badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.Equal(400, badRequest.StatusCode);
        ProblemDetails problem = Assert.IsType<ProblemDetails>(badRequest.Value);
        Assert.Equal("VALIDATION_ERROR", problem.Title);
        Assert.Equal("Name is required.", problem.Detail);
    }

    [Fact]
    public void ToActionResult_ShouldReturn404_WhenNotFoundError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("ROOM_NOT_FOUND", "Room not found.", ErrorType.NotFound));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        NotFoundObjectResult notFound = Assert.IsType<NotFoundObjectResult>(actionResult);
        Assert.Equal(404, notFound.StatusCode);
        ProblemDetails problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal("ROOM_NOT_FOUND", problem.Title);
    }

    [Fact]
    public void ToActionResult_ShouldReturn409_WhenConflictError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("CONFLICT", "Already exists.", ErrorType.Conflict));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        ConflictObjectResult conflict = Assert.IsType<ConflictObjectResult>(actionResult);
        Assert.Equal(409, conflict.StatusCode);
    }

    [Fact]
    public void ToActionResult_ShouldReturn403_WhenForbiddenError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("FORBIDDEN", "Access denied.", ErrorType.Forbidden));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        ObjectResult objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(403, objectResult.StatusCode);
    }

    [Fact]
    public void ToActionResult_ShouldReturn502_WhenPlatformError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("LINE_API_ERROR", "LINE API failed.", ErrorType.PlatformError));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        ObjectResult objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(502, objectResult.StatusCode);
    }

    [Fact]
    public void ToActionResult_ShouldReturn429_WhenRateLimitedError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("RATE_LIMITED", "Too many requests.", ErrorType.RateLimited));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        ObjectResult objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(429, objectResult.StatusCode);
    }

    [Fact]
    public void ToActionResult_ShouldReturn500_WhenInternalError()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("INTERNAL_ERROR", "Something broke.", ErrorType.Internal));

        // Act
        IActionResult actionResult = result.ToActionResult();

        // Assert
        ObjectResult objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact]
    public void ToCreatedResult_ShouldReturn201_WhenSuccess()
    {
        // Arrange
        Result<string> result = new Result<string>.Success("created-item");

        // Act
        IActionResult actionResult = result.ToCreatedResult("GetById", new { id = "123" });

        // Assert
        CreatedAtRouteResult created = Assert.IsType<CreatedAtRouteResult>(actionResult);
        Assert.Equal(201, created.StatusCode);
        Assert.Equal("created-item", created.Value);
        Assert.Equal("GetById", created.RouteName);
    }

    [Fact]
    public void ToCreatedResult_ShouldReturnError_WhenFailure()
    {
        // Arrange
        Result<string> result = new Result<string>.Failure(
            new Error("VALIDATION_ERROR", "Invalid.", ErrorType.Validation));

        // Act
        IActionResult actionResult = result.ToCreatedResult("GetById");

        // Assert
        BadRequestObjectResult badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.Equal(400, badRequest.StatusCode);
    }
}

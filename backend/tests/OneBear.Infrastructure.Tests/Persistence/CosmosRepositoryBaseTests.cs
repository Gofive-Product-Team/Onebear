using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Infrastructure.Persistence.Cosmos;

namespace OneBear.Infrastructure.Tests.Persistence;

public class CosmosRepositoryBaseTests
{
    private readonly Mock<Container> _containerMock = new();
    private readonly Mock<ILogger<TestRepository>> _loggerMock = new();

    [Fact]
    public async Task ReplaceWithRetry_SucceedsOnFirstAttempt()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        ItemResponse<TestEntity> mockResponse = CreateMockResponse(entity, "etag-2");

        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);
        TestEntity result = await repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e);

        Assert.Equal("etag-2", result.ETag);
    }

    [Fact]
    public async Task ReplaceWithRetry_RetriesOnPreconditionFailed()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        TestEntity freshEntity = new() { Id = "test-1", ETag = "etag-fresh" };
        ItemResponse<TestEntity> freshResponse = CreateMockResponse(freshEntity, "etag-fresh");
        ItemResponse<TestEntity> successResponse = CreateMockResponse(entity, "etag-success");

        int callCount = 0;
        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    throw new CosmosException("Precondition failed", HttpStatusCode.PreconditionFailed, 0, "", 0);
                return Task.FromResult(successResponse);
            });

        _containerMock.Setup(c => c.ReadItemAsync<TestEntity>(
            It.IsAny<string>(), It.IsAny<PartitionKey>(),
            It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(freshResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);
        TestEntity result = await repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e);

        Assert.Equal(2, callCount);
    }

    [Fact]
    public async Task ReplaceWithRetry_ThrowsConcurrencyConflict_AfterMaxRetries()
    {
        TestEntity entity = new() { Id = "test-1", ETag = "etag-1" };
        TestEntity freshEntity = new() { Id = "test-1", ETag = "etag-fresh" };
        ItemResponse<TestEntity> freshResponse = CreateMockResponse(freshEntity, "etag-fresh");

        _containerMock.Setup(c => c.ReplaceItemAsync(
            It.IsAny<TestEntity>(), It.IsAny<string>(),
            It.IsAny<PartitionKey>(), It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new CosmosException("Precondition failed", HttpStatusCode.PreconditionFailed, 0, "", 0));

        _containerMock.Setup(c => c.ReadItemAsync<TestEntity>(
            It.IsAny<string>(), It.IsAny<PartitionKey>(),
            It.IsAny<ItemRequestOptions>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(freshResponse);

        TestRepository repo = new(_containerMock.Object, _loggerMock.Object);

        await Assert.ThrowsAsync<ConcurrencyConflictException>(
            () => repo.TestReplaceWithRetry(entity, new PartitionKey("pk"), e => e));
    }

    private static ItemResponse<TestEntity> CreateMockResponse(TestEntity entity, string etag)
    {
        Mock<ItemResponse<TestEntity>> mock = new();
        mock.Setup(r => r.Resource).Returns(entity);
        mock.Setup(r => r.ETag).Returns(etag);
        return mock.Object;
    }

    // Test entity
    public class TestEntity : CosmosEntity
    {
        public string Id { get; set; } = default!;
    }

    // Expose protected methods for testing
    public class TestRepository : CosmosRepositoryBase<TestEntity>
    {
        public TestRepository(Container container, ILogger<TestRepository> logger)
            : base(container, logger) { }

        protected override string GetEntityId(TestEntity entity) => entity.Id;

        public Task<TestEntity> TestReplaceWithRetry(TestEntity entity, PartitionKey pk, Func<TestEntity, TestEntity> mutator)
            => ReplaceWithRetryAsync(entity, pk, mutator, CancellationToken.None);
    }
}

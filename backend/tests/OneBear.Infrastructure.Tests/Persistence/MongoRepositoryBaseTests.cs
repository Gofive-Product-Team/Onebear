using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Infrastructure.Persistence.Mongo;

namespace OneBear.Infrastructure.Tests.Persistence;

public class MongoRepositoryBaseTests
{
    private readonly Mock<IMongoCollection<TestEntity>> _collectionMock = new();
    private readonly Mock<ILogger<TestRepository>> _loggerMock = new();

    [Fact]
    public async Task ReplaceItem_ShouldSucceed_WhenVersionMatches()
    {
        // Arrange
        TestEntity entity = new() { Id = "test-1", Version = 1, Name = "Original" };

        Mock<ReplaceOneResult> replaceResult = new();
        replaceResult.Setup(r => r.ModifiedCount).Returns(1);

        _collectionMock.Setup(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<TestEntity>(),
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(replaceResult.Object);

        TestRepository repo = new(_collectionMock.Object, _loggerMock.Object);

        // Act
        TestEntity result = await repo.TestReplaceItem(entity);

        // Assert
        Assert.Equal(2, result.Version);
    }

    [Fact]
    public async Task ReplaceItem_ShouldThrowConcurrencyConflict_WhenVersionMismatch()
    {
        // Arrange
        TestEntity entity = new() { Id = "test-1", Version = 1, Name = "Original" };

        Mock<ReplaceOneResult> replaceResult = new();
        replaceResult.Setup(r => r.ModifiedCount).Returns(0);

        _collectionMock.Setup(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<TestEntity>(),
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(replaceResult.Object);

        TestRepository repo = new(_collectionMock.Object, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ConcurrencyConflictException>(
            () => repo.TestReplaceItem(entity));

        // Version should be reverted
        Assert.Equal(1, entity.Version);
    }

    [Fact]
    public async Task ReplaceWithRetry_ShouldRetryOnConflict()
    {
        // Arrange
        TestEntity entity = new() { Id = "test-1", Version = 1, Name = "Original" };
        TestEntity freshEntity = new() { Id = "test-1", Version = 2, Name = "Fresh" };

        Mock<ReplaceOneResult> failResult = new();
        failResult.Setup(r => r.ModifiedCount).Returns(0);

        Mock<ReplaceOneResult> successResult = new();
        successResult.Setup(r => r.ModifiedCount).Returns(1);

        int callCount = 0;
        _collectionMock.Setup(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<TestEntity>(),
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                callCount++;
                if (callCount == 1)
                    return Task.FromResult<ReplaceOneResult>(failResult.Object);
                return Task.FromResult<ReplaceOneResult>(successResult.Object);
            });

        // Mock FindAsync for re-fetch (ReadAsync)
        Mock<IAsyncCursor<TestEntity>> cursorMock = new();
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<TestEntity> { freshEntity });

        _collectionMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<FindOptions<TestEntity, TestEntity>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        TestRepository repo = new(_collectionMock.Object, _loggerMock.Object);

        // Act
        TestEntity result = await repo.TestReplaceWithRetry(entity, e => e);

        // Assert
        Assert.Equal(2, callCount);
        Assert.Equal(3, result.Version); // freshEntity had version 2, incremented to 3
    }

    [Fact]
    public async Task ReplaceWithRetry_ShouldThrowAfterMaxRetries()
    {
        // Arrange
        TestEntity entity = new() { Id = "test-1", Version = 1, Name = "Original" };
        TestEntity freshEntity = new() { Id = "test-1", Version = 2, Name = "Fresh" };

        Mock<ReplaceOneResult> failResult = new();
        failResult.Setup(r => r.ModifiedCount).Returns(0);

        _collectionMock.Setup(c => c.ReplaceOneAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<TestEntity>(),
            It.IsAny<ReplaceOptions>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(failResult.Object);

        // Mock FindAsync for re-fetch
        Mock<IAsyncCursor<TestEntity>> cursorMock = new();
        cursorMock.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        cursorMock.Setup(c => c.Current).Returns(new List<TestEntity> { freshEntity });

        _collectionMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<TestEntity>>(),
            It.IsAny<FindOptions<TestEntity, TestEntity>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        TestRepository repo = new(_collectionMock.Object, _loggerMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ConcurrencyConflictException>(
            () => repo.TestReplaceWithRetry(entity, e => e));
    }

    // Test entity
    public class TestEntity : MongoEntity
    {
        public string Name { get; set; } = default!;
    }

    // Expose protected methods for testing
    public class TestRepository : MongoRepositoryBase<TestEntity>
    {
        public TestRepository(IMongoCollection<TestEntity> collection, ILogger<TestRepository> logger)
            : base(collection, logger) { }

        public Task<TestEntity> TestReplaceItem(TestEntity entity)
            => ReplaceItemAsync(entity, CancellationToken.None);

        public Task<TestEntity> TestReplaceWithRetry(TestEntity entity, Func<TestEntity, TestEntity> mutator)
            => ReplaceWithRetryAsync(entity, mutator, CancellationToken.None);
    }
}

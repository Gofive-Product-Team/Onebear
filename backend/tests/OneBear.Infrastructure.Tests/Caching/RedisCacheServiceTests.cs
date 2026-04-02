using System.Text.Json;
using Moq;
using OneBear.Infrastructure.Caching;
using StackExchange.Redis;

namespace OneBear.Infrastructure.Tests.Caching;

public class RedisCacheServiceTests
{
    private readonly Mock<IConnectionMultiplexer> _redisMock = new();
    private readonly Mock<IDatabase> _dbMock = new();
    private readonly RedisCacheService _sut;

    public RedisCacheServiceTests()
    {
        _redisMock.Setup(r => r.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_dbMock.Object);
        _sut = new RedisCacheService(_redisMock.Object);
    }

    [Fact]
    public async Task GetOrSetAsync_ReturnsCachedValue_WhenCacheHit()
    {
        TestData expected = new("cached");
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(JsonSerializer.Serialize(expected));

        bool factoryCalled = false;
        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct =>
        {
            factoryCalled = true;
            return new TestData("from-factory");
        });

        Assert.Equal("cached", result!.Name);
        Assert.False(factoryCalled);
    }

    [Fact]
    public async Task GetOrSetAsync_CallsFactory_WhenCacheMiss()
    {
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct =>
        {
            return new TestData("from-factory");
        }, TimeSpan.FromMinutes(5));

        Assert.Equal("from-factory", result!.Name);
        _dbMock.Verify(d => d.StringSetAsync(
            It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), TimeSpan.FromMinutes(5),
            When.Always), Times.Once);
    }

    [Fact]
    public async Task GetOrSetAsync_ReturnsNull_WhenFactoryReturnsNull()
    {
        _dbMock.Setup(d => d.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        TestData? result = await _sut.GetOrSetAsync<TestData>("key", async ct => null);

        Assert.Null(result);
        _dbMock.Verify(d => d.StringSetAsync(
            It.IsAny<RedisKey>(), It.IsAny<RedisValue>(), It.IsAny<TimeSpan?>(),
            It.IsAny<When>()), Times.Never);
    }

    private record TestData(string Name);
}

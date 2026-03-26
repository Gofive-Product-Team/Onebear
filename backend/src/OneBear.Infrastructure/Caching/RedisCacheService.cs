namespace OneBear.Infrastructure.Caching;

using System.Text.Json;
using OneBear.Application.Common.Interfaces;
using StackExchange.Redis;

public class RedisCacheService : IAppCacheService
{
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        IDatabase db = _redis.GetDatabase();
        RedisValue value = await db.StringGetAsync(key);
        if (value.IsNullOrEmpty)
            return default;

        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default)
    {
        IDatabase db = _redis.GetDatabase();
        string json = JsonSerializer.Serialize(value);
        if (ttl.HasValue)
            await db.StringSetAsync(key, json, new Expiration(ttl.Value));
        else
            await db.StringSetAsync(key, json);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        IDatabase db = _redis.GetDatabase();
        await db.KeyDeleteAsync(key);
    }
}

namespace OneBear.Infrastructure.Caching;

using System.Text.Json;
using OneBear.Domain.Interfaces;
using StackExchange.Redis;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        IDatabase db = _redis.GetDatabase();
        RedisValue value = await db.StringGetAsync(key);
        if (value.IsNullOrEmpty)
            return default;
        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default) where T : class
    {
        IDatabase db = _redis.GetDatabase();
        string json = JsonSerializer.Serialize(value);
        await db.StringSetAsync(key, json, ttl, When.Always);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        IDatabase db = _redis.GetDatabase();
        await db.KeyDeleteAsync(key);
    }

    public async Task<T?> GetOrSetAsync<T>(string key, Func<CancellationToken, Task<T?>> factory, TimeSpan? ttl = null, CancellationToken ct = default) where T : class
    {
        T? cached = await GetAsync<T>(key, ct);
        if (cached is not null)
            return cached;

        T? value = await factory(ct);
        if (value is not null)
            await SetAsync(key, value, ttl, ct);

        return value;
    }

    public async Task<Dictionary<string, T?>> MultiGetAsync<T>(IEnumerable<string> keys, CancellationToken ct = default) where T : class
    {
        string[] keyArray = keys.ToArray();
        if (keyArray.Length == 0)
            return new();

        IDatabase db = _redis.GetDatabase();
        RedisKey[] redisKeys = keyArray.Select(k => (RedisKey)k).ToArray();
        RedisValue[] values = await db.StringGetAsync(redisKeys);

        Dictionary<string, T?> result = new(keyArray.Length);
        for (int i = 0; i < keyArray.Length; i++)
        {
            result[keyArray[i]] = values[i].IsNullOrEmpty
                ? default
                : JsonSerializer.Deserialize<T>(values[i]!);
        }

        return result;
    }
}

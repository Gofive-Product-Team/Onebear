namespace OneBear.Infrastructure;

using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string cosmosConnectionString, string redisConnectionString)
    {
        // TODO: register Cosmos repositories, Redis cache, platform adapters, blob storage
        return services;
    }
}

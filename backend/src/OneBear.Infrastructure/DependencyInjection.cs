namespace OneBear.Infrastructure;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Infrastructure.Caching;
using OneBear.Infrastructure.Persistence.Cosmos;
using OneBear.Infrastructure.Persistence.Cosmos.Repositories;
using OneBear.Infrastructure.Persistence.Cosmos.Seeding;
using StackExchange.Redis;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Cosmos DB
        services.AddSingleton(sp =>
        {
            string connectionString = configuration.GetConnectionString("CosmosDb")
                ?? throw new InvalidOperationException("CosmosDb connection string is required");
            return new CosmosClient(connectionString, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });
        });

        string databaseName = configuration.GetValue<string>("CosmosDb:DatabaseName") ?? "OneBear";
        services.AddSingleton(sp => new CosmosDbContext(sp.GetRequiredService<CosmosClient>(), databaseName));

        // Redis
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            string connectionString = configuration.GetConnectionString("Redis")
                ?? throw new InvalidOperationException("Redis connection string is required");
            return ConnectionMultiplexer.Connect(connectionString);
        });
        services.AddSingleton<ICacheService, RedisCacheService>();

        // Repositories
        services.AddScoped<IChatRoomRepository, ChatRoomRepository>();
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
        services.AddScoped<IChatUserRepository, ChatUserRepository>();
        services.AddScoped<IIntegrationChannelRepository, IntegrationChannelRepository>();
        services.AddScoped<IAttachmentRepository, AttachmentRepository>();
        services.AddScoped<IFollowupScheduleRepository, FollowupScheduleRepository>();
        services.AddScoped<IChatbotConfigurationRepository, ChatbotConfigurationRepository>();
        services.AddScoped<ICompanyFeatureSettingsRepository, CompanyFeatureSettingsRepository>();
        services.AddScoped<IUserVerificationRepository, UserVerificationRepository>();

        services.AddTransient<CosmosSeeder>();

        return services;
    }
}

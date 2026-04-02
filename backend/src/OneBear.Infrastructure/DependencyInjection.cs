namespace OneBear.Infrastructure;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Infrastructure.Caching;
using OneBear.Infrastructure.Messaging;
using OneBear.Infrastructure.Persistence.Cosmos;
using OneBear.Infrastructure.Persistence.Cosmos.Repositories;
using OneBear.Infrastructure.Persistence.Cosmos.Seeding;
using Azure.Storage.Blobs;
using OneBear.Infrastructure.PlatformAdapters;
using OneBear.Infrastructure.Storage;
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

        // Azure Blob Storage
        string? blobConnectionString = configuration.GetConnectionString("BlobStorage");
        if (!string.IsNullOrEmpty(blobConnectionString))
        {
            services.AddSingleton(new BlobServiceClient(blobConnectionString));
            services.AddSingleton<IBlobStorageService, AzureBlobStorageService>();
        }

        // Event publisher (MassTransit)
        services.AddScoped<IEventPublisher, MassTransitEventPublisher>();

        // MassTransit + RabbitMQ
        string rabbitMqConnectionString = configuration.GetConnectionString("RabbitMq")
            ?? "amqp://guest:guest@localhost:5672";
        services.AddMassTransitMessaging(rabbitMqConnectionString);

        // Platform adapters (keyed DI)
        services.AddKeyedScoped<IPlatformAdapter, LineAdapter>(SocialPlatform.Line);
        services.AddKeyedScoped<IPlatformAdapter, FacebookAdapter>(SocialPlatform.Facebook);
        services.AddKeyedScoped<IPlatformAdapter, InstagramAdapter>(SocialPlatform.Instagram);
        services.AddKeyedScoped<IPlatformAdapter, WhatsAppAdapter>(SocialPlatform.WhatsApp);
        services.AddKeyedScoped<IPlatformAdapter, EmailAdapter>(SocialPlatform.Email);
        services.AddKeyedScoped<IPlatformAdapter, TikTokAdapter>(SocialPlatform.TikTok);
        services.AddKeyedScoped<IPlatformAdapter, LazadaAdapter>(SocialPlatform.Lazada);
        services.AddKeyedScoped<IPlatformAdapter, ShopeeAdapter>(SocialPlatform.Shopee);

        // HttpClient for LINE API
        services.AddHttpClient("line-api", client =>
        {
            client.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        });

        return services;
    }
}

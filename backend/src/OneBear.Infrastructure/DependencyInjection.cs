namespace OneBear.Infrastructure;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using OneBear.Application.Integrations.Config;
using OneBear.Application.Integrations.Services;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Infrastructure.Caching;
using OneBear.Infrastructure.Messaging;
using OneBear.Infrastructure.Persistence.Mongo;
using OneBear.Infrastructure.Persistence.Mongo.Repositories;
using OneBear.Infrastructure.Persistence.Mongo.Seeding;
using Azure.Storage.Blobs;
using OneBear.Infrastructure.PlatformAdapters;
using OneBear.Infrastructure.Storage;
using StackExchange.Redis;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // MongoDB
        services.AddSingleton<IMongoClient>(sp =>
        {
            string connectionString = configuration.GetConnectionString("MongoDb")
                ?? throw new InvalidOperationException("MongoDb connection string is required");
            return new MongoClient(connectionString);
        });

        string databaseName = configuration.GetValue<string>("MongoDb:DatabaseName") ?? "OneBear";
        services.AddSingleton(sp => new MongoDbContext(sp.GetRequiredService<IMongoClient>(), databaseName));

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
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
        services.AddScoped<IAiActivityLogRepository, AiActivityLogRepository>();
        services.AddScoped<IAiCreditRepository, AiCreditRepository>();
        services.AddScoped<IUnansweredQuestionRepository, UnansweredQuestionRepository>();
        services.AddScoped<IUserProfileRepository, UserProfileRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        services.AddTransient<MongoSeeder>();

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

        // HttpClients for platform APIs
        void ConfigureJsonClient(System.Net.Http.HttpClient client) =>
            client.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

        services.AddHttpClient("line-api", client => ConfigureJsonClient(client));
        services.AddHttpClient("facebook-api", client =>
        {
            client.BaseAddress = new Uri("https://graph.facebook.com/v21.0/");
            ConfigureJsonClient(client);
        });
        services.AddHttpClient("instagram-api", client =>
        {
            client.BaseAddress = new Uri("https://graph.facebook.com/v21.0/");
            ConfigureJsonClient(client);
        });
        services.AddHttpClient("whatsapp-api", client =>
        {
            client.BaseAddress = new Uri("https://graph.facebook.com/v21.0/");
            ConfigureJsonClient(client);
        });
        services.AddHttpClient("email-api", client => ConfigureJsonClient(client));
        services.AddHttpClient("tiktok-api", client =>
        {
            client.BaseAddress = new Uri("https://open.tiktokapis.com/");
            ConfigureJsonClient(client);
        });
        services.AddHttpClient("lazada-api", client => ConfigureJsonClient(client));
        services.AddHttpClient("shopee-api", client =>
        {
            client.BaseAddress = new Uri("https://partner.shopeemobile.com/api/v2/");
            ConfigureJsonClient(client);
        });
        services.AddHttpClient("google-api", client => ConfigureJsonClient(client));
        services.AddHttpClient("microsoft-api", client => ConfigureJsonClient(client));

        // OAuth
        services.Configure<OAuthOptions>(configuration.GetSection(OAuthOptions.SectionName));
        services.AddScoped<OAuthService>();

        return services;
    }
}

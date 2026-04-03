namespace OneBear.Infrastructure.Persistence.Mongo.Seeding;

using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.ValueObjects;

public class MongoSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MongoSeeder> _logger;

    public MongoSeeder(MongoDbContext context, ILogger<MongoSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureIndexesAsync(CancellationToken ct = default)
    {
        // Rooms: 4 compound indexes
        await CreateIndexAsync(_context.Rooms, "ix_rooms_company_state_ts",
            Builders<ChatRoom>.IndexKeys
                .Ascending(r => r.CompanyId)
                .Ascending(r => r.State)
                .Descending(r => r.LastMessageTimestamp), ct);

        await CreateIndexAsync(_context.Rooms, "ix_rooms_company_state_platform_ts",
            Builders<ChatRoom>.IndexKeys
                .Ascending(r => r.CompanyId)
                .Ascending(r => r.State)
                .Ascending(r => r.Platform)
                .Descending(r => r.LastMessageTimestamp), ct);

        await CreateIndexAsync(_context.Rooms, "ix_rooms_company_state_assign_ts",
            Builders<ChatRoom>.IndexKeys
                .Ascending(r => r.CompanyId)
                .Ascending(r => r.State)
                .Ascending(r => r.AssignToUserId)
                .Descending(r => r.LastMessageTimestamp), ct);

        await CreateIndexAsync(_context.Rooms, "ix_rooms_company_followup",
            Builders<ChatRoom>.IndexKeys
                .Ascending(r => r.CompanyId)
                .Ascending(r => r.FollowupTimestamp), ct);

        // Messages: 2 indexes
        await CreateIndexAsync(_context.Messages, "ix_messages_room_deleted_ts",
            Builders<ChatMessage>.IndexKeys
                .Ascending(m => m.RoomId)
                .Ascending(m => m.IsDeleted)
                .Descending(m => m.Timestamp), ct);

        await CreateIndexAsync(_context.Messages, "ix_messages_room_mid",
            Builders<ChatMessage>.IndexKeys
                .Ascending(m => m.RoomId)
                .Ascending(m => m.Mid), ct);

        // Users: 2 indexes (1 unique)
        await CreateIndexAsync(_context.Users, "ix_users_company_external_platform",
            Builders<ChatUser>.IndexKeys
                .Ascending(u => u.CompanyId)
                .Ascending(u => u.ExternalId)
                .Ascending(u => u.Platform), ct, unique: true);

        await CreateIndexAsync(_context.Users, "ix_users_company_type_active",
            Builders<ChatUser>.IndexKeys
                .Ascending(u => u.CompanyId)
                .Ascending(u => u.Type)
                .Ascending(u => u.IsActive), ct);

        // IntegrationChannels: 2 indexes
        await CreateIndexAsync(_context.IntegrationChannels, "ix_integrations_company_platform",
            Builders<IntegrationChannel>.IndexKeys
                .Ascending(c => c.CompanyId)
                .Ascending(c => c.Platform), ct);

        await CreateIndexAsync(_context.IntegrationChannels, "ix_integrations_company_active",
            Builders<IntegrationChannel>.IndexKeys
                .Ascending(c => c.CompanyId)
                .Ascending(c => c.IsActive), ct);

        // Attachments: 1 index
        await CreateIndexAsync(_context.Attachments, "ix_attachments_room_message",
            Builders<Attachment>.IndexKeys
                .Ascending(a => a.RoomId)
                .Ascending(a => a.MessageId), ct);

        // FollowupSchedules: 2 indexes
        await CreateIndexAsync(_context.FollowupSchedules, "ix_followups_company_processed_ts",
            Builders<FollowupSchedule>.IndexKeys
                .Ascending(s => s.CompanyId)
                .Ascending(s => s.IsProcessed)
                .Ascending(s => s.ScheduledTimestamp), ct);

        await CreateIndexAsync(_context.FollowupSchedules, "ix_followups_room",
            Builders<FollowupSchedule>.IndexKeys
                .Ascending(s => s.RoomId), ct);

        // ChatbotConfigurations: 1 unique index
        await CreateIndexAsync(_context.ChatbotConfigurations, "ix_chatbot_company",
            Builders<ChatbotConfiguration>.IndexKeys
                .Ascending(c => c.CompanyId), ct, unique: true);

        // CompanyFeatureSettings: 1 unique index
        await CreateIndexAsync(_context.CompanyFeatureSettings, "ix_features_company",
            Builders<CompanyFeatureSettings>.IndexKeys
                .Ascending(c => c.CompanyId), ct, unique: true);

        // UserVerifications: 1 index
        await CreateIndexAsync(_context.UserVerifications, "ix_verifications_company_user",
            Builders<UserVerification>.IndexKeys
                .Ascending(v => v.CompanyId)
                .Ascending(v => v.UserId), ct);

        _logger.LogInformation("MongoDB indexes created/verified (16 total)");
    }

    private async Task CreateIndexAsync<T>(
        IMongoCollection<T> collection,
        string indexName,
        IndexKeysDefinition<T> keys,
        CancellationToken ct,
        bool unique = false)
    {
        CreateIndexOptions options = new() { Name = indexName, Unique = unique };
        CreateIndexModel<T> model = new(keys, options);
        await collection.Indexes.CreateOneAsync(model, cancellationToken: ct);
    }

    public async Task SeedDevelopmentDataAsync(CancellationToken ct = default)
    {
        string companyId = "company-demo-001";
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Integration Channels
        IntegrationChannel lineChannel = new()
        {
            Id = "int-line-001", CompanyId = companyId, Platform = SocialPlatform.Line,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { ChannelId = "demo-line-ch", ChannelSecret = "demo-secret", AccessToken = "demo-token" },
            GreetingMessages = [new() { Type = "text", Content = "Welcome! How can we help?", IsEnabled = true }],
            AutoReplies = [new() { IsEnabled = true, TriggerType = "outsideBusinessHours", Message = "We're offline. We'll reply during business hours." }],
            AutoAssignment = new AutoAssignmentSettings { IsEnabled = true, Mode = "roundRobin", AgentUserIds = ["agent-001", "agent-002"] },
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        IntegrationChannel fbChannel = new()
        {
            Id = "int-fb-002", CompanyId = companyId, Platform = SocialPlatform.Facebook,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { AppId = "demo-app-id", AppSecret = "demo-secret", AccessToken = "demo-token" },
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        await UpsertAsync(_context.IntegrationChannels, lineChannel, ct);
        await UpsertAsync(_context.IntegrationChannels, fbChannel, ct);

        // Chat Users
        ChatUser customer1 = new()
        {
            Id = "u-line-customer-001", CompanyId = companyId, ExternalId = "U1234567890abcdef",
            OriginalName = "Somchai K.", DisplayName = "Somchai K.", PictureUrl = null,
            IntegrationId = "int-line-001", Platform = SocialPlatform.Line, Type = UserType.Customer,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatUser agent1 = new()
        {
            Id = "agent-001", CompanyId = companyId, ExternalId = "agent-001",
            DisplayName = "Agent One", IntegrationId = "int-line-001",
            Platform = SocialPlatform.Line, Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatUser agent2 = new()
        {
            Id = "agent-002", CompanyId = companyId, ExternalId = "agent-002",
            DisplayName = "Agent Two", IntegrationId = "int-fb-002",
            Platform = SocialPlatform.Facebook, Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now, UpdatedBy = "system", UpdatedTimestamp = now
        };

        await UpsertAsync(_context.Users, customer1, ct);
        await UpsertAsync(_context.Users, agent1, ct);
        await UpsertAsync(_context.Users, agent2, ct);

        // Chat Rooms
        ChatRoom room1 = new()
        {
            Id = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            State = ChatState.New, Platform = SocialPlatform.Line, IntegrationId = "int-line-001",
            Unread = 2, CreatedTimestamp = now - 3600000, LastMessageTimestamp = now - 60000,
            Customer = new RoomCustomer { Name = "Somchai K.", ExternalId = "U1234567890abcdef" },
            CreatedBy = "system", UpdatedBy = "system", UpdatedTimestamp = now
        };

        ChatRoom room2 = new()
        {
            Id = "room-002", CompanyId = companyId, UserId = "u-line-customer-001",
            AssignToUserId = "agent-001", State = ChatState.InProgress,
            Platform = SocialPlatform.Facebook, IntegrationId = "int-fb-002",
            Unread = 0, CreatedTimestamp = now - 7200000, LastMessageTimestamp = now - 300000,
            Customer = new RoomCustomer { Name = "Somchai K.", ExternalId = "U1234567890abcdef" },
            Sessions = [new() { StartTimestamp = now - 3600000, AgentUserId = "agent-001" }],
            CreatedBy = "system", UpdatedBy = "agent-001", UpdatedTimestamp = now
        };

        await UpsertAsync(_context.Rooms, room1, ct);
        await UpsertAsync(_context.Rooms, room2, ct);

        // Messages
        ChatMessage msg1 = new()
        {
            Id = "msg-001", RoomId = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            Content = "Hello, I have a question about your product.", Platform = SocialPlatform.Line,
            Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = MessageDeliveryState.Delivered,
            CreatedTimestamp = now - 120000
        };

        ChatMessage msg2 = new()
        {
            Id = "msg-002", RoomId = "room-001", CompanyId = companyId, UserId = "u-line-customer-001",
            Platform = SocialPlatform.Line, Type = MessageType.Image, Timestamp = now - 60000,
            Attachment = new MessageAttachment { FileName = "product.jpg", FileUrl = "https://example.com/product.jpg", ContentType = "image/jpeg", Size = 102400 },
            DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000
        };

        ChatMessage msg3 = new()
        {
            Id = "msg-003", RoomId = "room-002", CompanyId = companyId, UserId = "u-line-customer-001",
            Content = "When will my order arrive?", Platform = SocialPlatform.Facebook,
            Type = MessageType.Text, Timestamp = now - 600000, DeliveryStatus = MessageDeliveryState.Delivered,
            CreatedTimestamp = now - 600000
        };

        ChatMessage msg4 = new()
        {
            Id = "msg-004", RoomId = "room-002", CompanyId = companyId, UserId = "agent-001",
            Content = "Let me check your order status.", Platform = SocialPlatform.Facebook,
            Type = MessageType.Text, Timestamp = now - 300000, DeliveryStatus = MessageDeliveryState.Delivered,
            CreatedTimestamp = now - 300000
        };

        ChatMessage msg5 = new()
        {
            Id = "msg-005", RoomId = "room-002", CompanyId = companyId, UserId = "system",
            Content = "Agent One joined the conversation.", Platform = SocialPlatform.Facebook,
            Type = MessageType.System, Timestamp = now - 3600000, DeliveryStatus = MessageDeliveryState.Delivered,
            CreatedTimestamp = now - 3600000
        };

        await UpsertAsync(_context.Messages, msg1, ct);
        await UpsertAsync(_context.Messages, msg2, ct);
        await UpsertAsync(_context.Messages, msg3, ct);
        await UpsertAsync(_context.Messages, msg4, ct);
        await UpsertAsync(_context.Messages, msg5, ct);

        // Attachment
        Attachment att1 = new()
        {
            Id = "att-001", RoomId = "room-001", MessageId = "msg-002", CompanyId = companyId,
            FileName = "product.jpg", FileUrl = "https://example.com/product.jpg",
            ContentType = "image/jpeg", Size = 102400, UploadedBy = "u-line-customer-001", Timestamp = now - 60000
        };
        await UpsertAsync(_context.Attachments, att1, ct);

        // FollowupSchedule
        FollowupSchedule followup1 = new()
        {
            Id = "followup-001", CompanyId = companyId, RoomId = "room-002",
            ScheduledTimestamp = now + 86400000, Content = "Follow up on order inquiry",
            CreatedBy = "agent-001", CreatedTimestamp = now
        };
        await UpsertAsync(_context.FollowupSchedules, followup1, ct);

        // ChatbotConfiguration
        ChatbotConfiguration chatbot1 = new()
        {
            Id = "chatbot-001", CompanyId = companyId, IsEnabled = true, ScheduleMode = "always",
            BusinessOverview = "We are a demo e-commerce company.",
            ResponseStyle = "Friendly and professional",
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertAsync(_context.ChatbotConfigurations, chatbot1, ct);

        // CompanyFeatureSettings
        CompanyFeatureSettings features1 = new()
        {
            Id = "features-001", CompanyId = companyId,
            Features = new() { ["chatbot"] = true, ["autoAssignment"] = true, ["followup"] = true, ["satisfactionSurvey"] = false },
            Settings = new() { ["maxAgents"] = "10", ["maxIntegrations"] = "5" },
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertAsync(_context.CompanyFeatureSettings, features1, ct);

        // UserVerification
        UserVerification verification1 = new()
        {
            Id = "verify-001", CompanyId = companyId, UserId = "agent-001",
            VerificationType = "email", VerificationValue = "agent1@example.com",
            IsVerified = true, VerifiedTimestamp = now, CreatedTimestamp = now
        };
        await UpsertAsync(_context.UserVerifications, verification1, ct);

        _logger.LogInformation("Development seed data created for company {CompanyId}", companyId);

        // Seed for dev-company-001 (default frontend login)
        await SeedDevCompanyAsync(now, ct);
    }

    private async Task SeedDevCompanyAsync(long now, CancellationToken ct)
    {
        string companyId = "dev-company-001";
        string devUserId = "dev-user-001";

        // Integrations
        IntegrationChannel lineCh = new()
        {
            Id = "dev-int-line", CompanyId = companyId, Platform = SocialPlatform.Line,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { ChannelId = "dev-line-ch", ChannelSecret = "secret", AccessToken = "token" },
            GreetingMessages = [new() { Type = "text", Content = "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e48\u0e30 \u0e21\u0e35\u0e2d\u0e30\u0e44\u0e23\u0e43\u0e2b\u0e49\u0e0a\u0e48\u0e27\u0e22\u0e44\u0e2b\u0e21\u0e04\u0e30?", IsEnabled = true }],
            AutoReplies = [new() { IsEnabled = true, TriggerType = "keyword", Keywords = ["\u0e23\u0e32\u0e04\u0e32", "price"], Message = "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e23\u0e2d\u0e2a\u0e31\u0e01\u0e04\u0e23\u0e39\u0e48 \u0e40\u0e08\u0e49\u0e32\u0e2b\u0e19\u0e49\u0e32\u0e17\u0e35\u0e48\u0e08\u0e30\u0e15\u0e2d\u0e1a\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e23\u0e32\u0e04\u0e32\u0e43\u0e2b\u0e49\u0e19\u0e30\u0e04\u0e30" }],
            AutoAssignment = new AutoAssignmentSettings { IsEnabled = true, Mode = "roundRobin", AgentUserIds = [devUserId] },
            Shortcuts = [
                new() { Id = "sc-1", Keyword = "/hi", Content = "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e48\u0e30 \u0e21\u0e35\u0e2d\u0e30\u0e44\u0e23\u0e43\u0e2b\u0e49\u0e0a\u0e48\u0e27\u0e22\u0e44\u0e2b\u0e21\u0e04\u0e30?" },
                new() { Id = "sc-2", Keyword = "/thanks", Content = "\u0e02\u0e2d\u0e1a\u0e04\u0e38\u0e13\u0e04\u0e48\u0e30 \u0e2b\u0e32\u0e01\u0e21\u0e35\u0e04\u0e33\u0e16\u0e32\u0e21\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e40\u0e15\u0e34\u0e21\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2a\u0e2d\u0e1a\u0e16\u0e32\u0e21\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e19\u0e30\u0e04\u0e30" },
                new() { Id = "sc-3", Keyword = "/wait", Content = "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e23\u0e2d\u0e2a\u0e31\u0e01\u0e04\u0e23\u0e39\u0e48\u0e19\u0e30\u0e04\u0e30 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e43\u0e2b\u0e49" }
            ],
            CreatedBy = "system", CreatedTimestamp = now
        };
        IntegrationChannel fbCh = new()
        {
            Id = "dev-int-fb", CompanyId = companyId, Platform = SocialPlatform.Facebook,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { AppId = "dev-fb-app", AppSecret = "secret", AccessToken = "token" },
            CreatedBy = "system", CreatedTimestamp = now
        };
        IntegrationChannel igCh = new()
        {
            Id = "dev-int-ig", CompanyId = companyId, Platform = SocialPlatform.Instagram,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { AppId = "dev-ig-app", AppSecret = "secret", AccessToken = "token" },
            CreatedBy = "system", CreatedTimestamp = now
        };
        IntegrationChannel waCh = new()
        {
            Id = "dev-int-wa", CompanyId = companyId, Platform = SocialPlatform.WhatsApp,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { PhoneNumberId = "dev-phone", AppSecret = "secret", AccessToken = "token" },
            CreatedBy = "system", CreatedTimestamp = now
        };
        IntegrationChannel shopCh = new()
        {
            Id = "dev-int-shopee", CompanyId = companyId, Platform = SocialPlatform.Shopee,
            IsActive = true, HasChatFeature = true,
            Credentials = new PlatformCredentials { AppId = "dev-shopee-partner", AppSecret = "secret", AccessToken = "token", ChannelId = "shop-001" },
            CreatedBy = "system", CreatedTimestamp = now
        };

        await UpsertAsync(_context.IntegrationChannels, lineCh, ct);
        await UpsertAsync(_context.IntegrationChannels, fbCh, ct);
        await UpsertAsync(_context.IntegrationChannels, igCh, ct);
        await UpsertAsync(_context.IntegrationChannels, waCh, ct);
        await UpsertAsync(_context.IntegrationChannels, shopCh, ct);

        // Users - dev agent + 6 customers
        ChatUser devAgent = new()
        {
            Id = devUserId, CompanyId = companyId, ExternalId = devUserId,
            DisplayName = "Dev User", Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now
        };

        ChatUser cust1 = new() { Id = "c-line-001", CompanyId = companyId, ExternalId = "Uf001", OriginalName = "\u0e2a\u0e21\u0e0a\u0e32\u0e22 \u0e43\u0e08\u0e14\u0e35", DisplayName = "\u0e2a\u0e21\u0e0a\u0e32\u0e22 \u0e43\u0e08\u0e14\u0e35", Platform = SocialPlatform.Line, IntegrationId = "dev-int-line", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust2 = new() { Id = "c-fb-001", CompanyId = companyId, ExternalId = "fb-001", OriginalName = "Nattaya S.", DisplayName = "Nattaya S.", Platform = SocialPlatform.Facebook, IntegrationId = "dev-int-fb", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust3 = new() { Id = "c-ig-001", CompanyId = companyId, ExternalId = "ig-001", OriginalName = "Ploy.beauty", DisplayName = "Ploy.beauty", Platform = SocialPlatform.Instagram, IntegrationId = "dev-int-ig", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust4 = new() { Id = "c-wa-001", CompanyId = companyId, ExternalId = "+66812345678", OriginalName = "Anon W.", DisplayName = "Anon W.", Platform = SocialPlatform.WhatsApp, IntegrationId = "dev-int-wa", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust5 = new() { Id = "c-line-002", CompanyId = companyId, ExternalId = "Uf002", OriginalName = "\u0e27\u0e34\u0e0a\u0e31\u0e22 \u0e21\u0e07\u0e04\u0e25", DisplayName = "\u0e27\u0e34\u0e0a\u0e31\u0e22 \u0e21\u0e07\u0e04\u0e25", Platform = SocialPlatform.Line, IntegrationId = "dev-int-line", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust6 = new() { Id = "c-shopee-001", CompanyId = companyId, ExternalId = "shopee-buyer-001", OriginalName = "Buyer_star99", DisplayName = "Buyer_star99", Platform = SocialPlatform.Shopee, IntegrationId = "dev-int-shopee", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };

        await UpsertAsync(_context.Users, devAgent, ct);
        await UpsertAsync(_context.Users, cust1, ct);
        await UpsertAsync(_context.Users, cust2, ct);
        await UpsertAsync(_context.Users, cust3, ct);
        await UpsertAsync(_context.Users, cust4, ct);
        await UpsertAsync(_context.Users, cust5, ct);
        await UpsertAsync(_context.Users, cust6, ct);

        // 6 Rooms
        ChatRoom r1 = new()
        {
            Id = "dev-room-001", CompanyId = companyId, UserId = "c-line-001",
            AssignToUserId = devUserId, State = ChatState.InProgress, Platform = SocialPlatform.Line,
            IntegrationId = "dev-int-line", Unread = 3,
            CreatedTimestamp = now - 86400000, LastMessageTimestamp = now - 30000,
            UserMessageTimestamp = now - 30000,
            Customer = new RoomCustomer { Name = "\u0e2a\u0e21\u0e0a\u0e32\u0e22 \u0e43\u0e08\u0e14\u0e35", ExternalId = "Uf001" },
            Tags = [new() { Id = "t1", Name = "VIP", Color = "#FFD700" }],
            CreatedBy = "system"
        };
        ChatRoom r2 = new()
        {
            Id = "dev-room-002", CompanyId = companyId, UserId = "c-fb-001",
            State = ChatState.New, Platform = SocialPlatform.Facebook,
            IntegrationId = "dev-int-fb", Unread = 1,
            CreatedTimestamp = now - 3600000, LastMessageTimestamp = now - 120000,
            UserMessageTimestamp = now - 120000,
            Customer = new RoomCustomer { Name = "Nattaya S.", ExternalId = "fb-001" },
            CreatedBy = "system"
        };
        ChatRoom r3 = new()
        {
            Id = "dev-room-003", CompanyId = companyId, UserId = "c-ig-001",
            AssignToUserId = devUserId, State = ChatState.InProgress, Platform = SocialPlatform.Instagram,
            IntegrationId = "dev-int-ig", Unread = 0,
            CreatedTimestamp = now - 172800000, LastMessageTimestamp = now - 1800000,
            Customer = new RoomCustomer { Name = "Ploy.beauty", ExternalId = "ig-001" },
            CreatedBy = "system"
        };
        ChatRoom r4 = new()
        {
            Id = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001",
            AssignToUserId = devUserId, State = ChatState.InProgress, Platform = SocialPlatform.WhatsApp,
            IntegrationId = "dev-int-wa", Unread = 5,
            CreatedTimestamp = now - 7200000, LastMessageTimestamp = now - 10000,
            UserMessageTimestamp = now - 10000,
            Customer = new RoomCustomer { Name = "Anon W.", ExternalId = "+66812345678" },
            FollowupTimestamp = now + 86400000, FollowupContent = "\u0e15\u0e34\u0e14\u0e15\u0e32\u0e21\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d",
            CreatedBy = "system"
        };
        ChatRoom r5 = new()
        {
            Id = "dev-room-005", CompanyId = companyId, UserId = "c-line-002",
            State = ChatState.Resolved, Platform = SocialPlatform.Line,
            IntegrationId = "dev-int-line", Unread = 0,
            CreatedTimestamp = now - 259200000, LastMessageTimestamp = now - 86400000,
            Customer = new RoomCustomer { Name = "\u0e27\u0e34\u0e0a\u0e31\u0e22 \u0e21\u0e07\u0e04\u0e25", ExternalId = "Uf002" },
            CreatedBy = "system"
        };
        ChatRoom r6 = new()
        {
            Id = "dev-room-006", CompanyId = companyId, UserId = "c-shopee-001",
            State = ChatState.New, Platform = SocialPlatform.Shopee,
            IntegrationId = "dev-int-shopee", Unread = 2,
            CreatedTimestamp = now - 1800000, LastMessageTimestamp = now - 60000,
            UserMessageTimestamp = now - 60000,
            Customer = new RoomCustomer { Name = "Buyer_star99", ExternalId = "shopee-buyer-001" },
            CreatedBy = "system"
        };

        await UpsertAsync(_context.Rooms, r1, ct);
        await UpsertAsync(_context.Rooms, r2, ct);
        await UpsertAsync(_context.Rooms, r3, ct);
        await UpsertAsync(_context.Rooms, r4, ct);
        await UpsertAsync(_context.Rooms, r5, ct);
        await UpsertAsync(_context.Rooms, r6, ct);

        // Messages - realistic conversation threads
        List<ChatMessage> messages = [
            // Room 1: LINE
            new() { Id = "dm-001", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e23\u0e31\u0e1a \u0e2a\u0e19\u0e43\u0e08\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e23\u0e38\u0e48\u0e19 A200 \u0e04\u0e23\u0e31\u0e1a", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 86400000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 86400000 },
            new() { Id = "dm-002", RoomId = "dev-room-001", CompanyId = companyId, UserId = devUserId, Content = "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e48\u0e30 \u0e22\u0e34\u0e19\u0e14\u0e35\u0e43\u0e2b\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23\u0e04\u0e48\u0e30 \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e23\u0e38\u0e48\u0e19 A200 \u0e23\u0e32\u0e04\u0e32 1,590 \u0e1a\u0e32\u0e17\u0e04\u0e48\u0e30", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 86300000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 86300000 },
            new() { Id = "dm-003", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "\u0e21\u0e35\u0e2a\u0e35\u0e2d\u0e30\u0e44\u0e23\u0e1a\u0e49\u0e32\u0e07\u0e04\u0e23\u0e31\u0e1a?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 85000000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 85000000 },
            new() { Id = "dm-004", RoomId = "dev-room-001", CompanyId = companyId, UserId = devUserId, Content = "\u0e21\u0e35\u0e2a\u0e35\u0e14\u0e33 \u0e2a\u0e35\u0e02\u0e32\u0e27 \u0e41\u0e25\u0e30\u0e2a\u0e35\u0e19\u0e49\u0e33\u0e40\u0e07\u0e34\u0e19\u0e04\u0e48\u0e30", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 84000000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 84000000 },
            new() { Id = "dm-005", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "\u0e02\u0e2d\u0e2a\u0e35\u0e19\u0e49\u0e33\u0e40\u0e07\u0e34\u0e19 2 \u0e0a\u0e34\u0e49\u0e19\u0e04\u0e23\u0e31\u0e1a \u0e2a\u0e48\u0e07\u0e44\u0e14\u0e49\u0e40\u0e21\u0e37\u0e48\u0e2d\u0e44\u0e2b\u0e23\u0e48?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 120000 },
            new() { Id = "dm-006", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "\u0e08\u0e48\u0e32\u0e22\u0e42\u0e2d\u0e19\u0e44\u0e14\u0e49\u0e44\u0e2b\u0e21\u0e04\u0e23\u0e31\u0e1a?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
            new() { Id = "dm-007", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Platform = SocialPlatform.Line, Type = MessageType.Image, Timestamp = now - 30000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 30000, Attachment = new MessageAttachment { FileName = "slip.jpg", FileUrl = "https://placehold.co/400x600/png?text=Payment+Slip", ContentType = "image/jpeg", Size = 85000 } },

            // Room 2: Facebook
            new() { Id = "dm-010", RoomId = "dev-room-002", CompanyId = companyId, UserId = "c-fb-001", Content = "Hi! Do you have any promotions this month?", Platform = SocialPlatform.Facebook, Type = MessageType.Text, Timestamp = now - 3600000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 3600000 },
            new() { Id = "dm-011", RoomId = "dev-room-002", CompanyId = companyId, UserId = "system", Content = "Welcome! How can we help?", Platform = SocialPlatform.Facebook, Type = MessageType.System, Timestamp = now - 3599000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 3599000 },
            new() { Id = "dm-012", RoomId = "dev-room-002", CompanyId = companyId, UserId = "c-fb-001", Content = "I saw your ad about 30% off. Is it still valid?", Platform = SocialPlatform.Facebook, Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 120000 },

            // Room 3: Instagram
            new() { Id = "dm-020", RoomId = "dev-room-003", CompanyId = companyId, UserId = "c-ig-001", Content = "\u0e02\u0e2d\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e04\u0e23\u0e35\u0e21\u0e01\u0e31\u0e19\u0e41\u0e14\u0e14\u0e2b\u0e19\u0e48\u0e2d\u0e22\u0e04\u0e48\u0e32 \ud83c\udf1e", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172800000 },
            new() { Id = "dm-021", RoomId = "dev-room-003", CompanyId = companyId, UserId = devUserId, Content = "\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e48\u0e30 \u0e04\u0e23\u0e35\u0e21\u0e01\u0e31\u0e19\u0e41\u0e14\u0e14 SPF50+ PA++++ \u0e23\u0e32\u0e04\u0e32 890 \u0e1a\u0e32\u0e17\u0e04\u0e48\u0e30 \u2600\ufe0f", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172700000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 172700000 },
            new() { Id = "dm-022", RoomId = "dev-room-003", CompanyId = companyId, UserId = "c-ig-001", Content = "\u0e2a\u0e31\u0e48\u0e07\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e04\u0e48\u0e30 \u0e2a\u0e48\u0e07 DM address \u0e43\u0e2b\u0e49\u0e19\u0e30\u0e04\u0e30", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172600000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172600000 },
            new() { Id = "dm-023", RoomId = "dev-room-003", CompanyId = companyId, UserId = devUserId, Content = "\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e04\u0e48\u0e30 \u0e23\u0e2d\u0e23\u0e31\u0e1a DM \u0e19\u0e30\u0e04\u0e30 \u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07 Kerry \u0e43\u0e0a\u0e49\u0e40\u0e27\u0e25\u0e32 2-3 \u0e27\u0e31\u0e19\u0e04\u0e48\u0e30 \ud83d\udce6", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 1800000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 1800000 },

            // Room 4: WhatsApp
            new() { Id = "dm-030", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Hello, I ordered item #ORD-4521 last week", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7200000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 7200000 },
            new() { Id = "dm-031", RoomId = "dev-room-004", CompanyId = companyId, UserId = devUserId, Content = "Hi Anon, let me check that for you.", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7100000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 7100000 },
            new() { Id = "dm-032", RoomId = "dev-room-004", CompanyId = companyId, UserId = devUserId, Content = "Your order is being prepared and should ship tomorrow.", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7000000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 7000000 },
            new() { Id = "dm-033", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "But I need it by Friday! Can you expedite?", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
            new() { Id = "dm-034", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Please this is really urgent \ud83d\ude4f", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 50000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 50000 },
            new() { Id = "dm-035", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "I'll pay extra for express shipping", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 40000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 40000 },
            new() { Id = "dm-036", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Are you there??", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 20000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 20000 },
            new() { Id = "dm-037", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "\ud83d\ude21", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 10000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 10000 },

            // Room 5: LINE (resolved)
            new() { Id = "dm-040", RoomId = "dev-room-005", CompanyId = companyId, UserId = "c-line-002", Content = "\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e41\u0e25\u0e49\u0e27\u0e04\u0e23\u0e31\u0e1a \u0e02\u0e2d\u0e1a\u0e04\u0e38\u0e13\u0e21\u0e32\u0e01\u0e04\u0e23\u0e31\u0e1a", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 172800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172800000 },
            new() { Id = "dm-041", RoomId = "dev-room-005", CompanyId = companyId, UserId = devUserId, Content = "\u0e22\u0e34\u0e19\u0e14\u0e35\u0e04\u0e48\u0e30 \u0e02\u0e2d\u0e1a\u0e04\u0e38\u0e13\u0e17\u0e35\u0e48\u0e43\u0e0a\u0e49\u0e1a\u0e23\u0e34\u0e01\u0e32\u0e23\u0e19\u0e30\u0e04\u0e30 \ud83d\ude0a", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 172700000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 172700000 },
            new() { Id = "dm-042", RoomId = "dev-room-005", CompanyId = companyId, UserId = "system", Content = "Room resolved by Dev User", Platform = SocialPlatform.Line, Type = MessageType.System, Timestamp = now - 86400000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 86400000 },

            // Room 6: Shopee
            new() { Id = "dm-050", RoomId = "dev-room-006", CompanyId = companyId, UserId = "c-shopee-001", Content = "\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e21\u0e35\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e2a\u0e48\u0e07\u0e44\u0e2b\u0e21\u0e04\u0e30?", Platform = SocialPlatform.Shopee, Type = MessageType.Text, Timestamp = now - 1800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 1800000 },
            new() { Id = "dm-051", RoomId = "dev-room-006", CompanyId = companyId, UserId = "c-shopee-001", Content = "\u0e16\u0e49\u0e32\u0e2a\u0e31\u0e48\u0e07\u0e27\u0e31\u0e19\u0e19\u0e35\u0e49\u0e2a\u0e48\u0e07\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e44\u0e2b\u0e21\u0e04\u0e30?", Platform = SocialPlatform.Shopee, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
        ];

        foreach (ChatMessage msg in messages)
        {
            await UpsertAsync(_context.Messages, msg, ct);
        }

        // Chatbot config
        ChatbotConfiguration devChatbot = new()
        {
            Id = "dev-chatbot", CompanyId = companyId, IsEnabled = true, ScheduleMode = "always",
            BusinessOverview = "One Bear Demo Shop \u2014 \u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32\u0e2d\u0e2d\u0e19\u0e44\u0e25\u0e19\u0e4c\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e44\u0e25\u0e1f\u0e4c\u0e2a\u0e44\u0e15\u0e25\u0e4c",
            ResponseStyle = "\u0e2a\u0e38\u0e20\u0e32\u0e1e \u0e40\u0e1b\u0e47\u0e19\u0e01\u0e31\u0e19\u0e40\u0e2d\u0e07 \u0e43\u0e0a\u0e49\u0e20\u0e32\u0e29\u0e32\u0e44\u0e17\u0e22\u0e40\u0e1b\u0e47\u0e19\u0e2b\u0e25\u0e31\u0e01",
            Instructions = "\u0e15\u0e2d\u0e1a\u0e04\u0e33\u0e16\u0e32\u0e21\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 \u0e23\u0e32\u0e04\u0e32 \u0e01\u0e32\u0e23\u0e08\u0e31\u0e14\u0e2a\u0e48\u0e07 \u0e16\u0e49\u0e32\u0e44\u0e21\u0e48\u0e41\u0e19\u0e48\u0e43\u0e08\u0e43\u0e2b\u0e49\u0e2a\u0e48\u0e07\u0e15\u0e48\u0e2d\u0e43\u0e2b\u0e49\u0e40\u0e08\u0e49\u0e32\u0e2b\u0e19\u0e49\u0e32\u0e17\u0e35\u0e48",
            KnowledgeSources = [new() { Id = "ks-1", Name = "Product Catalog", SourceType = "url", SourceUrl = "https://example.com/products", IsActive = true }],
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertAsync(_context.ChatbotConfigurations, devChatbot, ct);

        // Feature settings
        CompanyFeatureSettings devFeatures = new()
        {
            Id = "dev-features", CompanyId = companyId,
            Features = new() { ["chatbot"] = true, ["autoAssignment"] = true, ["followup"] = true, ["satisfactionSurvey"] = true },
            Settings = new() { ["maxAgents"] = "20", ["maxIntegrations"] = "10" },
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertAsync(_context.CompanyFeatureSettings, devFeatures, ct);

        _logger.LogInformation("Development seed data created for dev company {CompanyId}", companyId);
    }

    private async Task UpsertAsync<T>(IMongoCollection<T> collection, T item, CancellationToken ct) where T : MongoEntity
    {
        try
        {
            FilterDefinition<T> filter = Builders<T>.Filter.Eq(e => e.Id, item.Id);
            ReplaceOptions options = new() { IsUpsert = true };
            await collection.ReplaceOneAsync(filter, item, options, ct);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Seed upsert failed, skipping");
        }
    }
}

namespace OneBear.Infrastructure.Persistence.Cosmos.Seeding;

using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.ValueObjects;

public class CosmosSeeder
{
    private readonly CosmosDbContext _context;
    private readonly ILogger<CosmosSeeder> _logger;

    public CosmosSeeder(CosmosDbContext context, ILogger<CosmosSeeder> logger)
    {
        _context = context;
        _logger = logger;
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

        await UpsertIfNotExistsAsync(_context.IntegrationChannels, lineChannel, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, fbChannel, companyId, ct);

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

        await UpsertIfNotExistsAsync(_context.Users, customer1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, agent1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, agent2, companyId, ct);

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

        await UpsertIfNotExistsAsync(_context.Rooms, room1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, room2, companyId, ct);

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

        await UpsertIfNotExistsAsync(_context.Messages, msg1, "room-001", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg2, "room-001", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg3, "room-002", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg4, "room-002", ct);
        await UpsertIfNotExistsAsync(_context.Messages, msg5, "room-002", ct);

        // Attachment
        Attachment att1 = new()
        {
            Id = "att-001", RoomId = "room-001", MessageId = "msg-002", CompanyId = companyId,
            FileName = "product.jpg", FileUrl = "https://example.com/product.jpg",
            ContentType = "image/jpeg", Size = 102400, UploadedBy = "u-line-customer-001", Timestamp = now - 60000
        };
        await UpsertIfNotExistsAsync(_context.Attachments, att1, "room-001", ct);

        // FollowupSchedule
        FollowupSchedule followup1 = new()
        {
            Id = "followup-001", CompanyId = companyId, RoomId = "room-002",
            ScheduledTimestamp = now + 86400000, Content = "Follow up on order inquiry",
            CreatedBy = "agent-001", CreatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.FollowupSchedules, followup1, companyId, ct);

        // ChatbotConfiguration
        ChatbotConfiguration chatbot1 = new()
        {
            Id = "chatbot-001", CompanyId = companyId, IsEnabled = true, ScheduleMode = "always",
            BusinessOverview = "We are a demo e-commerce company.",
            ResponseStyle = "Friendly and professional",
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.ChatbotConfigurations, chatbot1, companyId, ct);

        // CompanyFeatureSettings
        CompanyFeatureSettings features1 = new()
        {
            Id = "features-001", CompanyId = companyId,
            Features = new() { ["chatbot"] = true, ["autoAssignment"] = true, ["followup"] = true, ["satisfactionSurvey"] = false },
            Settings = new() { ["maxAgents"] = "10", ["maxIntegrations"] = "5" },
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.CompanyFeatureSettings, features1, companyId, ct);

        // UserVerification
        UserVerification verification1 = new()
        {
            Id = "verify-001", CompanyId = companyId, UserId = "agent-001",
            VerificationType = "email", VerificationValue = "agent1@example.com",
            IsVerified = true, VerifiedTimestamp = now, CreatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.UserVerifications, verification1, companyId, ct);

        _logger.LogInformation("Development seed data created for company {CompanyId}", companyId);

        // ── Seed for dev-company-001 (default frontend login) ────────────
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
            GreetingMessages = [new() { Type = "text", Content = "สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ?", IsEnabled = true }],
            AutoReplies = [new() { IsEnabled = true, TriggerType = "keyword", Keywords = ["ราคา", "price"], Message = "กรุณารอสักครู่ เจ้าหน้าที่จะตอบเรื่องราคาให้นะคะ" }],
            AutoAssignment = new AutoAssignmentSettings { IsEnabled = true, Mode = "roundRobin", AgentUserIds = [devUserId] },
            Shortcuts = [
                new() { Id = "sc-1", Keyword = "/hi", Content = "สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ?" },
                new() { Id = "sc-2", Keyword = "/thanks", Content = "ขอบคุณค่ะ หากมีคำถามเพิ่มเติมสามารถสอบถามได้เลยนะคะ" },
                new() { Id = "sc-3", Keyword = "/wait", Content = "กรุณารอสักครู่นะคะ กำลังตรวจสอบให้" }
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

        await UpsertIfNotExistsAsync(_context.IntegrationChannels, lineCh, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, fbCh, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, igCh, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, waCh, companyId, ct);
        await UpsertIfNotExistsAsync(_context.IntegrationChannels, shopCh, companyId, ct);

        // Users — dev agent + 6 customers
        ChatUser devAgent = new()
        {
            Id = devUserId, CompanyId = companyId, ExternalId = devUserId,
            DisplayName = "Dev User", Type = UserType.Agent,
            CreatedBy = "system", CreatedTimestamp = now
        };

        ChatUser cust1 = new() { Id = "c-line-001", CompanyId = companyId, ExternalId = "Uf001", OriginalName = "สมชาย ใจดี", DisplayName = "สมชาย ใจดี", Platform = SocialPlatform.Line, IntegrationId = "dev-int-line", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust2 = new() { Id = "c-fb-001", CompanyId = companyId, ExternalId = "fb-001", OriginalName = "Nattaya S.", DisplayName = "Nattaya S.", Platform = SocialPlatform.Facebook, IntegrationId = "dev-int-fb", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust3 = new() { Id = "c-ig-001", CompanyId = companyId, ExternalId = "ig-001", OriginalName = "Ploy.beauty", DisplayName = "Ploy.beauty", Platform = SocialPlatform.Instagram, IntegrationId = "dev-int-ig", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust4 = new() { Id = "c-wa-001", CompanyId = companyId, ExternalId = "+66812345678", OriginalName = "Anon W.", DisplayName = "Anon W.", Platform = SocialPlatform.WhatsApp, IntegrationId = "dev-int-wa", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust5 = new() { Id = "c-line-002", CompanyId = companyId, ExternalId = "Uf002", OriginalName = "วิชัย มงคล", DisplayName = "วิชัย มงคล", Platform = SocialPlatform.Line, IntegrationId = "dev-int-line", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };
        ChatUser cust6 = new() { Id = "c-shopee-001", CompanyId = companyId, ExternalId = "shopee-buyer-001", OriginalName = "Buyer_star99", DisplayName = "Buyer_star99", Platform = SocialPlatform.Shopee, IntegrationId = "dev-int-shopee", Type = UserType.Customer, CreatedBy = "system", CreatedTimestamp = now };

        await UpsertIfNotExistsAsync(_context.Users, devAgent, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust2, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust3, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust4, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust5, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Users, cust6, companyId, ct);

        // 6 Rooms — different platforms, states, unread counts
        ChatRoom r1 = new()
        {
            Id = "dev-room-001", CompanyId = companyId, UserId = "c-line-001",
            AssignToUserId = devUserId, State = ChatState.InProgress, Platform = SocialPlatform.Line,
            IntegrationId = "dev-int-line", Unread = 3,
            CreatedTimestamp = now - 86400000, LastMessageTimestamp = now - 30000,
            UserMessageTimestamp = now - 30000,
            Customer = new RoomCustomer { Name = "สมชาย ใจดี", ExternalId = "Uf001" },
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
            FollowupTimestamp = now + 86400000, FollowupContent = "ติดตามเรื่องสั่งซื้อ",
            CreatedBy = "system"
        };
        ChatRoom r5 = new()
        {
            Id = "dev-room-005", CompanyId = companyId, UserId = "c-line-002",
            State = ChatState.Resolved, Platform = SocialPlatform.Line,
            IntegrationId = "dev-int-line", Unread = 0,
            CreatedTimestamp = now - 259200000, LastMessageTimestamp = now - 86400000,
            Customer = new RoomCustomer { Name = "วิชัย มงคล", ExternalId = "Uf002" },
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

        await UpsertIfNotExistsAsync(_context.Rooms, r1, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, r2, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, r3, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, r4, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, r5, companyId, ct);
        await UpsertIfNotExistsAsync(_context.Rooms, r6, companyId, ct);

        // Messages — realistic conversation threads
        List<ChatMessage> messages = [
            // Room 1: LINE - สมชาย สอบถามสินค้า (3 unread)
            new() { Id = "dm-001", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "สวัสดีครับ สนใจสินค้ารุ่น A200 ครับ", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 86400000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 86400000 },
            new() { Id = "dm-002", RoomId = "dev-room-001", CompanyId = companyId, UserId = devUserId, Content = "สวัสดีค่ะ ยินดีให้บริการค่ะ สินค้ารุ่น A200 ราคา 1,590 บาทค่ะ", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 86300000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 86300000 },
            new() { Id = "dm-003", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "มีสีอะไรบ้างครับ?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 85000000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 85000000 },
            new() { Id = "dm-004", RoomId = "dev-room-001", CompanyId = companyId, UserId = devUserId, Content = "มีสีดำ สีขาว และสีน้ำเงินค่ะ", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 84000000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 84000000 },
            new() { Id = "dm-005", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "ขอสีน้ำเงิน 2 ชิ้นครับ ส่งได้เมื่อไหร่?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 120000 },
            new() { Id = "dm-006", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Content = "จ่ายโอนได้ไหมครับ?", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
            new() { Id = "dm-007", RoomId = "dev-room-001", CompanyId = companyId, UserId = "c-line-001", Platform = SocialPlatform.Line, Type = MessageType.Image, Timestamp = now - 30000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 30000, Attachment = new MessageAttachment { FileName = "slip.jpg", FileUrl = "https://placehold.co/400x600/png?text=Payment+Slip", ContentType = "image/jpeg", Size = 85000 } },

            // Room 2: Facebook - Nattaya สอบถามโปร (1 unread)
            new() { Id = "dm-010", RoomId = "dev-room-002", CompanyId = companyId, UserId = "c-fb-001", Content = "Hi! Do you have any promotions this month?", Platform = SocialPlatform.Facebook, Type = MessageType.Text, Timestamp = now - 3600000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 3600000 },
            new() { Id = "dm-011", RoomId = "dev-room-002", CompanyId = companyId, UserId = "system", Content = "Welcome! How can we help?", Platform = SocialPlatform.Facebook, Type = MessageType.System, Timestamp = now - 3599000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 3599000 },
            new() { Id = "dm-012", RoomId = "dev-room-002", CompanyId = companyId, UserId = "c-fb-001", Content = "I saw your ad about 30% off. Is it still valid?", Platform = SocialPlatform.Facebook, Type = MessageType.Text, Timestamp = now - 120000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 120000 },

            // Room 3: Instagram - Ploy สอบถาม (handled, 0 unread)
            new() { Id = "dm-020", RoomId = "dev-room-003", CompanyId = companyId, UserId = "c-ig-001", Content = "ขอรายละเอียดครีมกันแดดหน่อยค่า 🌞", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172800000 },
            new() { Id = "dm-021", RoomId = "dev-room-003", CompanyId = companyId, UserId = devUserId, Content = "สวัสดีค่ะ ครีมกันแดด SPF50+ PA++++ ราคา 890 บาทค่ะ ☀️", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172700000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 172700000 },
            new() { Id = "dm-022", RoomId = "dev-room-003", CompanyId = companyId, UserId = "c-ig-001", Content = "สั่งได้เลยค่า ส่ง DM address ให้นะคะ", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 172600000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172600000 },
            new() { Id = "dm-023", RoomId = "dev-room-003", CompanyId = companyId, UserId = devUserId, Content = "ได้เลยค่ะ รอรับ DM นะคะ จัดส่ง Kerry ใช้เวลา 2-3 วันค่ะ 📦", Platform = SocialPlatform.Instagram, Type = MessageType.Text, Timestamp = now - 1800000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 1800000 },

            // Room 4: WhatsApp - Anon สั่งสินค้า (5 unread, urgent)
            new() { Id = "dm-030", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Hello, I ordered item #ORD-4521 last week", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7200000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 7200000 },
            new() { Id = "dm-031", RoomId = "dev-room-004", CompanyId = companyId, UserId = devUserId, Content = "Hi Anon, let me check that for you.", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7100000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 7100000 },
            new() { Id = "dm-032", RoomId = "dev-room-004", CompanyId = companyId, UserId = devUserId, Content = "Your order is being prepared and should ship tomorrow.", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 7000000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 7000000 },
            new() { Id = "dm-033", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "But I need it by Friday! Can you expedite?", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
            new() { Id = "dm-034", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Please this is really urgent 🙏", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 50000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 50000 },
            new() { Id = "dm-035", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "I'll pay extra for express shipping", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 40000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 40000 },
            new() { Id = "dm-036", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "Are you there??", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 20000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 20000 },
            new() { Id = "dm-037", RoomId = "dev-room-004", CompanyId = companyId, UserId = "c-wa-001", Content = "😡", Platform = SocialPlatform.WhatsApp, Type = MessageType.Text, Timestamp = now - 10000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 10000 },

            // Room 5: LINE - วิชัย (resolved)
            new() { Id = "dm-040", RoomId = "dev-room-005", CompanyId = companyId, UserId = "c-line-002", Content = "สินค้าได้รับแล้วครับ ขอบคุณมากครับ", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 172800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 172800000 },
            new() { Id = "dm-041", RoomId = "dev-room-005", CompanyId = companyId, UserId = devUserId, Content = "ยินดีค่ะ ขอบคุณที่ใช้บริการนะคะ 😊", Platform = SocialPlatform.Line, Type = MessageType.Text, Timestamp = now - 172700000, DeliveryStatus = MessageDeliveryState.Sent, CreatedTimestamp = now - 172700000 },
            new() { Id = "dm-042", RoomId = "dev-room-005", CompanyId = companyId, UserId = "system", Content = "Room resolved by Dev User", Platform = SocialPlatform.Line, Type = MessageType.System, Timestamp = now - 86400000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 86400000 },

            // Room 6: Shopee - Buyer สอบถามสินค้า (2 unread)
            new() { Id = "dm-050", RoomId = "dev-room-006", CompanyId = companyId, UserId = "c-shopee-001", Content = "สินค้ามีพร้อมส่งไหมคะ?", Platform = SocialPlatform.Shopee, Type = MessageType.Text, Timestamp = now - 1800000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 1800000 },
            new() { Id = "dm-051", RoomId = "dev-room-006", CompanyId = companyId, UserId = "c-shopee-001", Content = "ถ้าสั่งวันนี้ส่งได้เลยไหมคะ?", Platform = SocialPlatform.Shopee, Type = MessageType.Text, Timestamp = now - 60000, DeliveryStatus = MessageDeliveryState.Delivered, CreatedTimestamp = now - 60000 },
        ];

        foreach (ChatMessage msg in messages)
        {
            await UpsertIfNotExistsAsync(_context.Messages, msg, msg.RoomId, ct);
        }

        // Chatbot config
        ChatbotConfiguration devChatbot = new()
        {
            Id = "dev-chatbot", CompanyId = companyId, IsEnabled = true, ScheduleMode = "always",
            BusinessOverview = "One Bear Demo Shop — ร้านค้าออนไลน์สินค้าไลฟ์สไตล์",
            ResponseStyle = "สุภาพ เป็นกันเอง ใช้ภาษาไทยเป็นหลัก",
            Instructions = "ตอบคำถามลูกค้าเรื่องสินค้า ราคา การจัดส่ง ถ้าไม่แน่ใจให้ส่งต่อให้เจ้าหน้าที่",
            KnowledgeSources = [new() { Id = "ks-1", Name = "Product Catalog", SourceType = "url", SourceUrl = "https://example.com/products", IsActive = true }],
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.ChatbotConfigurations, devChatbot, companyId, ct);

        // Feature settings
        CompanyFeatureSettings devFeatures = new()
        {
            Id = "dev-features", CompanyId = companyId,
            Features = new() { ["chatbot"] = true, ["autoAssignment"] = true, ["followup"] = true, ["satisfactionSurvey"] = true },
            Settings = new() { ["maxAgents"] = "20", ["maxIntegrations"] = "10" },
            UpdatedBy = "system", UpdatedTimestamp = now
        };
        await UpsertIfNotExistsAsync(_context.CompanyFeatureSettings, devFeatures, companyId, ct);

        _logger.LogInformation("Development seed data created for dev company {CompanyId}", companyId);
    }

    private async Task UpsertIfNotExistsAsync<T>(Container container, T item, string partitionKeyValue, CancellationToken ct)
    {
        try
        {
            await container.UpsertItemAsync(item, new PartitionKey(partitionKeyValue), cancellationToken: ct);
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogDebug("Seed item already exists, skipping");
        }
    }
}

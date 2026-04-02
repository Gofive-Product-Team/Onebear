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

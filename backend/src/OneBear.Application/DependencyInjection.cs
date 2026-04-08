namespace OneBear.Application;

using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.Messaging;
using OneBear.Application.Messaging.Services;
using OneBear.Application.Messaging.Validators;
using OneBear.Application.Rooms.Services;
using OneBear.Application.Integrations.Services;
using OneBear.Application.Chatbot.Services;
using OneBear.Application.Notifications.Services;
using OneBear.Application.Customers.Services;
using OneBear.Application.Dashboard;
using OneBear.Application.Auth.Services;
using OneBear.Application.Products.Services;
using OneBear.Application.Orders.Services;
using OneBear.Application.Slips.Services;
using OneBear.Application.Followup.Services;
using OneBear.Application.Bookings.Services;
using OneBear.Application.Insights.Services;
using OneBear.Application.Onboarding.Services;
using OneBear.Domain.Interfaces;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Auth
        services.AddHttpClient<KeycloakAdminService>();

        services.AddValidatorsFromAssemblyContaining<SendMessageCommandValidator>();

        // Core messaging pipeline
        services.AddScoped<MessageOrchestrator>();
        services.AddSingleton<SpamDetectionService>();

        // Room services (interface → implementation)
        services.AddScoped<IRoomStateService, RoomStateService>();
        services.AddScoped<RoomQueryService>();
        services.AddScoped<RoomParticipantService>();
        services.AddScoped<BadgeService>();

        // Integration services (interface → implementation)
        services.AddScoped<IIntegrationService, IntegrationService>();
        services.AddScoped<IAutoAssignmentService, AutoAssignmentService>();
        services.AddScoped<GreetingService>();
        services.AddScoped<AutoReplyService>();
        services.AddScoped<ShortcutService>();

        // Chat user service (interface → implementation)
        services.AddScoped<IChatUserService, ChatUserService>();

        // Chatbot & notifications
        services.AddScoped<ChatbotService>();
        services.AddScoped<IAiActivityLogger, AiActivityLogger>();
        services.AddScoped<ICreditService, MongoCreditService>();
        services.AddScoped<NotificationService>();

        // Orders
        services.AddScoped<OrderManagementService>();
        services.AddScoped<IOrderService>(sp => sp.GetRequiredService<OrderManagementService>());

        // Slips
        services.AddScoped<SlipVerificationManagementService>();
        services.AddScoped<ISlipVerificationService>(sp => sp.GetRequiredService<SlipVerificationManagementService>());

        // Follow-up configuration
        services.AddScoped<FollowupConfigurationService>();

        // Bookings
        services.AddScoped<BookingManagementService>();

        // AI Insights
        services.AddScoped<InsightsService>();

        // Onboarding
        services.AddScoped<OnboardingService>();

        // Product catalog bridge (AI reads real product data)
        services.AddScoped<IProductCatalogService, ProductCatalogBridge>();

        // Stubs for services not yet fully implemented
        services.AddScoped<IPaymentLinkService, StubPaymentLinkService>();

        // Products
        services.AddScoped<ProductService>();

        // Dashboard
        services.AddScoped<DashboardService>();

        // CRM
        services.AddScoped<CustomerService>();
        services.AddScoped<TagRecalculationService>();
        services.AddScoped<ActivityLogService>();
        services.AddScoped<DuplicateDetectionService>();

        return services;
    }
}

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
using OneBear.Domain.Interfaces;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
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

        // CRM
        services.AddScoped<CustomerService>();
        services.AddScoped<TagRecalculationService>();
        services.AddScoped<ActivityLogService>();
        services.AddScoped<DuplicateDetectionService>();

        return services;
    }
}

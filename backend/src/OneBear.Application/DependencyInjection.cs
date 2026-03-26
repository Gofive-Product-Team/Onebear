namespace OneBear.Application;

using Microsoft.Extensions.DependencyInjection;
using OneBear.Application.Messaging;
using OneBear.Application.Rooms.Services;
using OneBear.Application.Integrations.Services;
using OneBear.Application.Chatbot.Services;
using OneBear.Application.Notifications.Services;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<MessageOrchestrator>();
        services.AddScoped<RoomQueryService>();
        services.AddScoped<RoomStateService>();
        services.AddScoped<RoomParticipantService>();
        services.AddScoped<BadgeService>();
        services.AddScoped<IntegrationService>();
        services.AddScoped<GreetingService>();
        services.AddScoped<AutoReplyService>();
        services.AddScoped<ShortcutService>();
        services.AddScoped<AutoAssignmentService>();
        services.AddScoped<ChatbotService>();
        services.AddScoped<NotificationService>();
        return services;
    }
}

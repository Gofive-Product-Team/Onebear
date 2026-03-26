namespace OneBear.Infrastructure.Messaging;

using MassTransit;
using Microsoft.Extensions.DependencyInjection;

public static class MassTransitConfiguration
{
    public static IServiceCollection AddMassTransitMessaging(this IServiceCollection services, string connectionString)
    {
        services.AddMassTransit(x =>
        {
            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(new Uri(connectionString));
                cfg.ConfigureEndpoints(context);
            });
        });
        return services;
    }
}

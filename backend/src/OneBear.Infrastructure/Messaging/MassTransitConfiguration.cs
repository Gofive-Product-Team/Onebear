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

                // Default retry policy: 3 retries with incremental backoff
                cfg.UseMessageRetry(r => r.Intervals(
                    TimeSpan.FromSeconds(1),
                    TimeSpan.FromSeconds(5),
                    TimeSpan.FromSeconds(15)));

                cfg.ConfigureEndpoints(context);
            });
        });
        return services;
    }
}

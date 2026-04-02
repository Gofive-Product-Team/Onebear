using MassTransit;
using OneBear.Worker.Consumers;
using Quartz;

var builder = Host.CreateApplicationBuilder(args);

// Quartz.NET
builder.Services.AddQuartz();
builder.Services.AddQuartzHostedService(opt => opt.WaitForJobsToComplete = true);

// MassTransit + RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Register all consumers from this assembly
    x.AddConsumer<SendGreetingMessageConsumer>();
    x.AddConsumer<SendAutoReplyMessageConsumer>();
    x.AddConsumer<SendAiChatbotMessageConsumer>();
    x.AddConsumer<SocialChatNotificationConsumer>();
    x.AddConsumer<LinkTagsToRoomConsumer>();
    x.AddConsumer<WebhookIntegrationConsumer>();
    x.AddConsumer<UpsertEmployeeChatDataConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["ConnectionStrings:RabbitMq"] ?? "amqp://guest:guest@localhost:5672");

        // Default retry policy: 3 retries with incremental backoff
        cfg.UseMessageRetry(r => r.Intervals(
            TimeSpan.FromSeconds(1),
            TimeSpan.FromSeconds(5),
            TimeSpan.FromSeconds(15)));

        cfg.ConfigureEndpoints(context);
    });
});

var host = builder.Build();
host.Run();

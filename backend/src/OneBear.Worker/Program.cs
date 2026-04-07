using MassTransit;
using OneBear.Application;
using OneBear.Domain.Interfaces;
using OneBear.Infrastructure;
using OneBear.Worker.Consumers;
using OneBear.Worker.Jobs;
using OneBear.Worker.Services;
using Quartz;

var builder = Host.CreateApplicationBuilder(args);

// Application + Infrastructure services (repos, cache, adapters, etc.)
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Worker-specific: SignalR notifier (logging-only; in prod use Azure SignalR REST API)
builder.Services.AddSingleton<ISignalRNotifier, WorkerSignalRNotifier>();

// Quartz.NET scheduled jobs
builder.Services.AddQuartz(q =>
{
    // Token refresh check — every 30 minutes
    JobKey tokenJobKey = new("IntegrationTokenValidation");
    q.AddJob<IntegrationTokenValidationJob>(opts => opts.WithIdentity(tokenJobKey));
    q.AddTrigger(opts => opts
        .ForJob(tokenJobKey)
        .WithIdentity("IntegrationTokenValidation-trigger")
        .WithSimpleSchedule(s => s.WithIntervalInMinutes(30).RepeatForever()));

    // Attended user cleanup — every 5 minutes
    JobKey cleanupJobKey = new("AttendedUserCleanup");
    q.AddJob<AttendedUserCleanupJob>(opts => opts.WithIdentity(cleanupJobKey));
    q.AddTrigger(opts => opts
        .ForJob(cleanupJobKey)
        .WithIdentity("AttendedUserCleanup-trigger")
        .WithSimpleSchedule(s => s.WithIntervalInMinutes(5).RepeatForever()));

    // Followup reminder — every 1 minute
    JobKey followupJobKey = new("FollowupReminder");
    q.AddJob<FollowupReminderJob>(opts => opts.WithIdentity(followupJobKey));
    q.AddTrigger(opts => opts
        .ForJob(followupJobKey)
        .WithIdentity("FollowupReminder-trigger")
        .WithSimpleSchedule(s => s.WithIntervalInMinutes(1).RepeatForever()));

    // Scheduled tag recalculation — daily at 2:00 AM UTC
    JobKey tagRecalcJobKey = new("ScheduledTagRecalculation");
    q.AddJob<ScheduledTagRecalculationJob>(opts => opts.WithIdentity(tagRecalcJobKey));
    q.AddTrigger(opts => opts
        .ForJob(tagRecalcJobKey)
        .WithIdentity("ScheduledTagRecalculation-trigger")
        .WithCronSchedule("0 0 2 * * ?"));

    // SLA escalation — every 1 minute
    JobKey slaJobKey = new("SlaEscalation");
    q.AddJob<SlaEscalationJob>(opts => opts.WithIdentity(slaJobKey));
    q.AddTrigger(opts => opts
        .ForJob(slaJobKey)
        .WithIdentity("SlaEscalation-trigger")
        .WithCronSchedule("0 * * * * ?"));

    // AI follow-up — every 5 minutes (skeleton)
    JobKey followUpJobKey = new("FollowUp");
    q.AddJob<FollowUpJob>(opts => opts.WithIdentity(followUpJobKey));
    q.AddTrigger(opts => opts
        .ForJob(followUpJobKey)
        .WithIdentity("FollowUp-trigger")
        .WithSimpleSchedule(s => s.WithIntervalInMinutes(5).RepeatForever()));
});
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

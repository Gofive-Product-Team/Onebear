using MassTransit;
using Quartz;

var builder = Host.CreateApplicationBuilder(args);

// Quartz.NET
builder.Services.AddQuartz();
builder.Services.AddQuartzHostedService(opt => opt.WaitForJobsToComplete = true);

// MassTransit + RabbitMQ
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["ConnectionStrings:RabbitMq"] ?? "amqp://guest:guest@localhost:5672");
        cfg.ConfigureEndpoints(context);
    });
});

var host = builder.Build();
host.Run();

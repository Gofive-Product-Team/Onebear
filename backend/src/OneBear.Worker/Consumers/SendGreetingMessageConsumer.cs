namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Application.Integrations.Services;
using OneBear.Domain.Interfaces;

public class SendGreetingMessageConsumer : IConsumer<SendGreetingMessage>
{
    private readonly GreetingService _greetingService;
    private readonly IServiceProvider _sp;
    private readonly ILogger<SendGreetingMessageConsumer> _logger;

    public SendGreetingMessageConsumer(
        GreetingService greetingService,
        IServiceProvider sp,
        ILogger<SendGreetingMessageConsumer> logger)
    {
        _greetingService = greetingService;
        _sp = sp;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendGreetingMessage> context)
    {
        SendGreetingMessage msg = context.Message;
        _logger.LogInformation("Processing greeting for room {RoomId} on {Platform}",
            msg.RoomId, msg.Platform);

        IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(msg.Platform);

        await _greetingService.SendGreetingAsync(
            msg.RoomId, msg.CompanyId, msg.IntegrationId,
            msg.Platform, msg.RecipientExternalId,
            adapter, context.CancellationToken);
    }
}

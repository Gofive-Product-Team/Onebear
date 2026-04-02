namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Application.Integrations.Services;
using OneBear.Domain.Interfaces;

public class SendAutoReplyMessageConsumer : IConsumer<SendAutoReplyMessage>
{
    private readonly AutoReplyService _autoReplyService;
    private readonly IServiceProvider _sp;
    private readonly ILogger<SendAutoReplyMessageConsumer> _logger;

    public SendAutoReplyMessageConsumer(
        AutoReplyService autoReplyService,
        IServiceProvider sp,
        ILogger<SendAutoReplyMessageConsumer> logger)
    {
        _autoReplyService = autoReplyService;
        _sp = sp;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendAutoReplyMessage> context)
    {
        SendAutoReplyMessage msg = context.Message;
        _logger.LogInformation("Processing auto-reply for room {RoomId}", msg.RoomId);

        IPlatformAdapter adapter = _sp.GetRequiredKeyedService<IPlatformAdapter>(msg.Platform);

        await _autoReplyService.ProcessAutoReplyAsync(
            msg.RoomId, msg.CompanyId, msg.IntegrationId,
            msg.Platform, msg.RecipientExternalId, msg.InboundContent,
            adapter, context.CancellationToken);
    }
}

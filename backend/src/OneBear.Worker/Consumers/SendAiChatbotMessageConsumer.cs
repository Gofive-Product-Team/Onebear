namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;

public class SendAiChatbotMessageConsumer : IConsumer<SendAiChatbotMessage>
{
    private readonly ILogger<SendAiChatbotMessageConsumer> _logger;

    public SendAiChatbotMessageConsumer(ILogger<SendAiChatbotMessageConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<SendAiChatbotMessage> context)
    {
        SendAiChatbotMessage msg = context.Message;

        _logger.LogInformation(
            "AI chatbot request for room {RoomId}, message {MessageId} on {Platform}. " +
            "AI service integration pending external API setup.",
            msg.RoomId, msg.MessageId, msg.Platform);

        // AI chatbot integration requires external AI service API endpoint.
        // When configured, this consumer will:
        // 1. Check 4 eligibility criteria (CompanyFeatureSettings, ChatbotConfiguration, Room.IsAiMuted, business hours)
        // 2. Forward message to AI service REST API
        // 3. Handle callback response to send reply via platform adapter

        return Task.CompletedTask;
    }
}

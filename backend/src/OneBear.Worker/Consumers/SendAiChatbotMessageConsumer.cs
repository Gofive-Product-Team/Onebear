namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class SendAiChatbotMessageConsumer : IConsumer<SendAiChatbotMessage>
{
    public Task Consume(ConsumeContext<SendAiChatbotMessage> context)
    {
        // TODO: implement AI chatbot message logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

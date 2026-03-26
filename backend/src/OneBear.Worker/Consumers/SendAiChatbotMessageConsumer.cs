namespace OneBear.Worker.Consumers;

using MassTransit;

public record SendAiChatbotMessage(string RoomId, string CompanyId, string UserMessage);

public class SendAiChatbotMessageConsumer : IConsumer<SendAiChatbotMessage>
{
    public Task Consume(ConsumeContext<SendAiChatbotMessage> context)
    {
        // TODO: implement AI chatbot message logic
        return Task.CompletedTask;
    }
}

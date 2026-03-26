namespace OneBear.Worker.Consumers;

using MassTransit;

public record SendGreetingMessage(string RoomId, string CompanyId);

public class SendGreetingMessageConsumer : IConsumer<SendGreetingMessage>
{
    public Task Consume(ConsumeContext<SendGreetingMessage> context)
    {
        // TODO: implement greeting message logic
        return Task.CompletedTask;
    }
}

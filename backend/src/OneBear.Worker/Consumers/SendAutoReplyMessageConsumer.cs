namespace OneBear.Worker.Consumers;

using MassTransit;

public record SendAutoReplyMessage(string RoomId, string CompanyId);

public class SendAutoReplyMessageConsumer : IConsumer<SendAutoReplyMessage>
{
    public Task Consume(ConsumeContext<SendAutoReplyMessage> context)
    {
        // TODO: implement auto-reply message logic
        return Task.CompletedTask;
    }
}

namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class UpsertEmployeeChatDataConsumer : IConsumer<UpsertEmployeeChatData>
{
    public Task Consume(ConsumeContext<UpsertEmployeeChatData> context)
    {
        // TODO: implement employee chat data upsert logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

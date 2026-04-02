namespace OneBear.Worker.Consumers;

using MassTransit;
using OneBear.Application.Events;

public class LinkTagsToRoomConsumer : IConsumer<LinkTagsToRoom>
{
    public Task Consume(ConsumeContext<LinkTagsToRoom> context)
    {
        // TODO: implement tag linking logic (Step 9 — Automation)
        return Task.CompletedTask;
    }
}

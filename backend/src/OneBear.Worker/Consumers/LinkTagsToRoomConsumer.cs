namespace OneBear.Worker.Consumers;

using MassTransit;

public record LinkTagsToRoom(string RoomId, string CompanyId, List<string> TagIds);

public class LinkTagsToRoomConsumer : IConsumer<LinkTagsToRoom>
{
    public Task Consume(ConsumeContext<LinkTagsToRoom> context)
    {
        // TODO: implement tag linking logic
        return Task.CompletedTask;
    }
}

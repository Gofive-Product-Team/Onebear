namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class LinkTagsToRoomConsumer : IConsumer<LinkTagsToRoom>
{
    private readonly IChatRoomRepository _roomRepo;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<LinkTagsToRoomConsumer> _logger;

    public LinkTagsToRoomConsumer(
        IChatRoomRepository roomRepo,
        ISignalRNotifier signalRNotifier,
        ILogger<LinkTagsToRoomConsumer> logger)
    {
        _roomRepo = roomRepo;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<LinkTagsToRoom> context)
    {
        LinkTagsToRoom msg = context.Message;
        CancellationToken ct = context.CancellationToken;

        if (msg.TagIds.Count == 0)
        {
            _logger.LogDebug("No tags to link for room {RoomId}", msg.RoomId);
            return;
        }

        ChatRoom? room = await _roomRepo.GetByIdAsync(msg.RoomId, msg.CompanyId, ct);
        if (room is null)
        {
            _logger.LogWarning("Room {RoomId} not found for tag linking", msg.RoomId);
            return;
        }

        // Merge new tags (avoid duplicates)
        HashSet<string> existingIds = room.Tags.Select(t => t.Id).ToHashSet();
        foreach (string tagId in msg.TagIds)
        {
            if (!existingIds.Contains(tagId))
            {
                room.Tags.Add(new RoomTag { Id = tagId });
            }
        }

        await _roomRepo.UpdateAsync(room, ct);

        // Notify via SignalR
        await _signalRNotifier.SendToRoomAsync(msg.RoomId, "UpdateRoom",
            new { id = msg.RoomId, tags = room.Tags.Select(t => t.Id).ToList() }, ct);

        _logger.LogInformation("Linked {Count} tags to room {RoomId} (source: {Source})",
            msg.TagIds.Count, msg.RoomId, msg.Source);
    }
}

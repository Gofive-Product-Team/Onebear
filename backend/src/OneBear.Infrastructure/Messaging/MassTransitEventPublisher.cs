namespace OneBear.Infrastructure.Messaging;

using MassTransit;
using OneBear.Domain.Interfaces;

public class MassTransitEventPublisher : IEventPublisher
{
    private readonly IPublishEndpoint _publishEndpoint;

    public MassTransitEventPublisher(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task PublishAsync<T>(T message, CancellationToken ct) where T : class
    {
        await _publishEndpoint.Publish(message, ct);
    }
}

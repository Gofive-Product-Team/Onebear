using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using OneBear.API.Hubs;
using OneBear.Application.Common.Interfaces;
using OneBear.Application.RealTime.Dtos;

namespace OneBear.API.Services;

public class TypingTracker : ITypingTracker
{
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _timers = new();
    private readonly IHubContext<ChatHub> _hubContext;

    public TypingTracker(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public void Track(string userId, string roomId, bool isTyping)
    {
        string key = $"{userId}:{roomId}";

        if (_timers.TryRemove(key, out CancellationTokenSource? existing))
        {
            existing.Cancel();
            existing.Dispose();
        }

        if (isTyping)
        {
            CancellationTokenSource cts = new();
            _timers[key] = cts;

            _ = Task.Delay(TimeSpan.FromSeconds(10), cts.Token)
                .ContinueWith(async completedTask =>
                {
                    _timers.TryRemove(key, out CancellationTokenSource? removed);
                    removed?.Dispose();
                    await _hubContext.Clients.Group($"room:{roomId}")
                        .SendAsync("TypingIndicator", new TypingIndicatorDto
                        {
                            UserId = userId,
                            DisplayName = string.Empty,
                            RoomId = roomId,
                            IsTyping = false
                        });
                }, TaskContinuationOptions.OnlyOnRanToCompletion);
        }
    }
}

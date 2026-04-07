namespace OneBear.Worker.Consumers;

using MassTransit;
using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class UpsertEmployeeChatDataConsumer : IConsumer<UpsertEmployeeChatData>
{
    private readonly IChatUserRepository _userRepo;
    private readonly ILogger<UpsertEmployeeChatDataConsumer> _logger;

    public UpsertEmployeeChatDataConsumer(
        IChatUserRepository userRepo,
        ILogger<UpsertEmployeeChatDataConsumer> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UpsertEmployeeChatData> context)
    {
        UpsertEmployeeChatData msg = context.Message;
        CancellationToken ct = context.CancellationToken;

        _logger.LogInformation("Upserting employee chat data for user {UserId} in company {CompanyId}",
            msg.UserId, msg.CompanyId);

        // Look up existing agent user
        ChatUser? existing = await _userRepo.GetByIdAsync(msg.UserId, msg.CompanyId, ct);

        if (existing is not null)
        {
            bool changed = false;

            if (!string.IsNullOrEmpty(msg.DisplayName) && msg.DisplayName != existing.DisplayName)
            {
                existing.DisplayName = msg.DisplayName;
                changed = true;
            }

            if (msg.PictureUrl is not null && msg.PictureUrl != existing.PictureUrl)
            {
                existing.PictureUrl = msg.PictureUrl;
                changed = true;
            }

            if (changed)
            {
                existing.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                await _userRepo.UpsertAsync(existing, ct);
                _logger.LogInformation("Updated employee profile for {UserId}", msg.UserId);
            }
        }
        else
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            ChatUser newUser = new()
            {
                Id = msg.UserId,
                CompanyId = msg.CompanyId,
                DisplayName = msg.DisplayName,
                PictureUrl = msg.PictureUrl,
                Type = UserType.Agent,
                IsActive = true,
                CreatedTimestamp = now,
                UpdatedTimestamp = now
            };
            await _userRepo.UpsertAsync(newUser, ct);
            _logger.LogInformation("Created new employee ChatUser {UserId}", msg.UserId);
        }
    }
}

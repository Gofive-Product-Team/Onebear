namespace OneBear.Application.Messaging.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces.Repositories;

public class ChatUserService : IChatUserService
{
    private readonly IChatUserRepository _userRepo;
    private readonly ILogger<ChatUserService> _logger;

    public ChatUserService(IChatUserRepository userRepo, ILogger<ChatUserService> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task<Result<ChatUser>> UpsertExternalUserAsync(
        string externalUserId, string platform, string integrationId, string companyId,
        string? displayName, string? pictureUrl, CancellationToken ct)
    {
        ChatUser? existing = await _userRepo.GetByExternalIdAsync(companyId, externalUserId, platform, ct);

        if (existing is not null)
        {
            bool changed = false;

            if (displayName is not null && displayName != existing.DisplayName)
            {
                existing.DisplayName = displayName;
                changed = true;
            }

            if (pictureUrl is not null && pictureUrl != existing.PictureUrl)
            {
                existing.PictureUrl = pictureUrl;
                changed = true;
            }

            if (changed)
            {
                existing.UpdatedTimestamp = DateTimeHelper.NowUnixMilliseconds();
                existing.ProfileUpdateTimestamp = DateTimeHelper.NowUnixMilliseconds();
                await _userRepo.UpsertAsync(existing, ct);

                _logger.LogDebug("Updated profile for ChatUser {UserId} (external: {ExternalId})",
                    existing.Id, externalUserId);
            }

            return new Result<ChatUser>.Success(existing);
        }

        long now = DateTimeHelper.NowUnixMilliseconds();
        ChatUser newUser = new()
        {
            Id = Guid.NewGuid().ToString(),
            CompanyId = companyId,
            ExternalId = externalUserId,
            DisplayName = displayName,
            OriginalName = displayName,
            PictureUrl = pictureUrl,
            IntegrationId = integrationId,
            Platform = platform,
            Type = UserType.Customer,
            IsActive = true,
            CreatedTimestamp = now,
            UpdatedTimestamp = now,
            ProfileUpdateTimestamp = now
        };

        await _userRepo.UpsertAsync(newUser, ct);

        _logger.LogInformation("Created new ChatUser {UserId} for external user {ExternalId} on {Platform}",
            newUser.Id, externalUserId, platform);

        return new Result<ChatUser>.Success(newUser);
    }
}

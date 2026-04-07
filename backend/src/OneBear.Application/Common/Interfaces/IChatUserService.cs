namespace OneBear.Application.Common.Interfaces;

using OneBear.Domain.Common;
using OneBear.Domain.Entities;

public interface IChatUserService
{
    Task<Result<ChatUser>> UpsertExternalUserAsync(
        string externalUserId, string platform, string integrationId, string companyId,
        string? displayName, string? pictureUrl, CancellationToken ct);
}

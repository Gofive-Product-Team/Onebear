namespace OneBear.Application.Integrations.Services;

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class AutoAssignmentService : IAutoAssignmentService
{
    private static readonly ConcurrentDictionary<string, int> RoundRobinCounters = new();

    private readonly IIntegrationChannelRepository _integrationRepo;
    private readonly ILogger<AutoAssignmentService> _logger;

    public AutoAssignmentService(
        IIntegrationChannelRepository integrationRepo,
        ILogger<AutoAssignmentService> logger)
    {
        _integrationRepo = integrationRepo;
        _logger = logger;
    }

    public async Task<Result<ChatRoom>> TryAssignAsync(ChatRoom room, string companyId, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(room.AssignToUserId))
        {
            return new Result<ChatRoom>.Success(room);
        }

        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(room.IntegrationId, companyId, ct);
        if (integration is null)
        {
            _logger.LogWarning("Integration {IntegrationId} not found for auto-assignment", room.IntegrationId);
            return new Result<ChatRoom>.Success(room);
        }

        AutoAssignmentSettings? settings = integration.AutoAssignment;
        if (settings is null || !settings.IsEnabled)
        {
            return new Result<ChatRoom>.Success(room);
        }

        if (settings.AgentUserIds.Count == 0)
        {
            _logger.LogWarning("Auto-assignment enabled for integration {IntegrationId} but no agents configured",
                room.IntegrationId);
            return new Result<ChatRoom>.Success(room);
        }

        string agentId = GetNextAgent(room.IntegrationId, settings.AgentUserIds);
        room.AssignToUserId = agentId;

        _logger.LogInformation("Auto-assigned room {RoomId} to agent {AgentId} via round-robin",
            room.Id, agentId);

        return new Result<ChatRoom>.Success(room);
    }

    public Task<Result<ChatRoom>> TryAssignSenderAsync(ChatRoom room, string senderUserId, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(room.AssignToUserId))
        {
            return Task.FromResult<Result<ChatRoom>>(new Result<ChatRoom>.Success(room));
        }

        room.AssignToUserId = senderUserId;

        _logger.LogInformation("Assigned room {RoomId} to sender {SenderUserId}", room.Id, senderUserId);

        return Task.FromResult<Result<ChatRoom>>(new Result<ChatRoom>.Success(room));
    }

    private static string GetNextAgent(string integrationId, List<string> agentUserIds)
    {
        int counter = RoundRobinCounters.AddOrUpdate(integrationId, 0, (_, current) => current + 1);
        return agentUserIds[counter % agentUserIds.Count];
    }
}

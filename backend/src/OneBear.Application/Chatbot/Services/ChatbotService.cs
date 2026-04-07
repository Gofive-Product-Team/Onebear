namespace OneBear.Application.Chatbot.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Events;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class ChatbotService
{
    private readonly IChatbotConfigurationRepository _chatbotRepo;
    private readonly IChatRoomRepository _roomRepo;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<ChatbotService> _logger;

    public ChatbotService(
        IChatbotConfigurationRepository chatbotRepo,
        IChatRoomRepository roomRepo,
        IEventPublisher eventPublisher,
        ILogger<ChatbotService> logger)
    {
        _chatbotRepo = chatbotRepo;
        _roomRepo = roomRepo;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    /// <summary>
    /// Evaluates 4 eligibility checks and publishes SendAiChatbotMessage if all pass.
    /// </summary>
    public async Task<Result<bool>> TryEngageAsync(
        ChatRoom room, ChatMessage message, string integrationId, CancellationToken ct)
    {
        // Check 1: Chatbot enabled for company
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(room.CompanyId, ct);
        if (config is null || !config.IsEnabled)
        {
            _logger.LogDebug("AI chatbot not enabled for company {CompanyId}", room.CompanyId);
            return new Result<bool>.Success(false);
        }

        // Check 2: Schedule check — is the chatbot active right now?
        if (!IsWithinSchedule(config))
        {
            _logger.LogDebug("AI chatbot outside schedule for company {CompanyId}", room.CompanyId);
            return new Result<bool>.Success(false);
        }

        // Check 3: Room not AI-muted (agent manually muted AI for this room)
        if (room.IsAiMuted)
        {
            _logger.LogDebug("AI chatbot muted for room {RoomId}", room.Id);
            return new Result<bool>.Success(false);
        }

        // Check 4: No agent currently attending the room
        if (room.AttendedUserIds.Count > 0)
        {
            _logger.LogDebug("Agent attending room {RoomId}, skipping AI chatbot", room.Id);
            return new Result<bool>.Success(false);
        }

        // All checks passed — publish event for AI processing
        await _eventPublisher.PublishAsync(new SendAiChatbotMessage
        {
            RoomId = room.Id,
            CompanyId = room.CompanyId,
            IntegrationId = integrationId,
            MessageId = message.Id,
            Content = message.Content ?? "",
            Platform = room.Platform,
            RecipientExternalId = room.Customer?.ExternalId ?? ""
        }, ct);

        _logger.LogInformation("AI chatbot engaged for room {RoomId}, message {MessageId}",
            room.Id, message.Id);

        return new Result<bool>.Success(true);
    }

    /// <summary>
    /// Process AI callback — the AI service responded with a message.
    /// Returns the AI response content for the caller to send via platform adapter.
    /// </summary>
    public async Task<Result<string>> ProcessAiCallbackAsync(
        string companyId, string roomId, string responseContent, CancellationToken ct)
    {
        ChatbotConfiguration? config = await _chatbotRepo.GetByCompanyIdAsync(companyId, ct);
        if (config is null || !config.IsEnabled)
        {
            return new Result<string>.Failure(
                new Error("CHATBOT_DISABLED", "Chatbot is no longer enabled.", ErrorType.Validation));
        }

        if (string.IsNullOrWhiteSpace(responseContent))
        {
            return new Result<string>.Failure(
                new Error("EMPTY_RESPONSE", "AI returned empty response.", ErrorType.Validation));
        }

        _logger.LogInformation("Processing AI callback for room {RoomId} in company {CompanyId}",
            roomId, companyId);

        return new Result<string>.Success(responseContent);
    }

    /// <summary>
    /// Handle AI handoff — called when the AI decides it cannot handle the conversation
    /// (e.g. confidence below threshold). Mutes AI for the room and sets handoff metadata.
    /// </summary>
    public async Task<Result<ChatRoom>> HandleHandoffAsync(
        ChatRoom room, CancellationToken ct)
    {
        long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        room.IsAiMuted = true;
        room.HandoffSource = "ai";
        room.HandoffSourceName = "AI";
        room.HandoffTimestamp = now;

        ChatRoom updated = await _roomRepo.UpdateAsync(room, ct);

        _logger.LogInformation(
            "AI handed off room {RoomId} to admin at {Timestamp}",
            room.Id, now);

        return new Result<ChatRoom>.Success(updated);
    }

    // ── Schedule evaluation ──────────────────────────────────────────

    private static bool IsWithinSchedule(ChatbotConfiguration config)
    {
        if (config.ScheduleMode == "always")
            return true;

        if (config.ScheduleMode == "never")
            return false;

        // "scheduled" mode — check day schedules
        if (config.ScheduleMode == "scheduled" && config.DaySchedules.Count > 0)
        {
            DateTimeOffset now = DateTimeOffset.UtcNow;
            int todayDow = (int)now.DayOfWeek; // Sunday=0, Monday=1, ...

            DaySchedule? todaySchedule = config.DaySchedules
                .FirstOrDefault(d => d.DayOfWeek == todayDow);

            if (todaySchedule is null || !todaySchedule.IsEnabled)
                return false;

            // If start/end time not set, treat as all-day enabled
            if (string.IsNullOrEmpty(todaySchedule.StartTime) || string.IsNullOrEmpty(todaySchedule.EndTime))
                return true;

            // Parse HH:mm format
            if (TimeOnly.TryParse(todaySchedule.StartTime, out TimeOnly start)
                && TimeOnly.TryParse(todaySchedule.EndTime, out TimeOnly end))
            {
                TimeOnly currentTime = TimeOnly.FromDateTime(now.UtcDateTime);
                return currentTime >= start && currentTime <= end;
            }

            return true;
        }

        // "outside_hours" mode — chatbot active OUTSIDE business hours
        if (config.ScheduleMode == "outside_hours" && config.DaySchedules.Count > 0)
        {
            DateTimeOffset now = DateTimeOffset.UtcNow;
            int todayDow = (int)now.DayOfWeek;

            DaySchedule? todaySchedule = config.DaySchedules
                .FirstOrDefault(d => d.DayOfWeek == todayDow);

            // No schedule for today = outside hours → chatbot active
            if (todaySchedule is null || !todaySchedule.IsEnabled)
                return true;

            if (string.IsNullOrEmpty(todaySchedule.StartTime) || string.IsNullOrEmpty(todaySchedule.EndTime))
                return false; // All-day business hours → chatbot inactive

            if (TimeOnly.TryParse(todaySchedule.StartTime, out TimeOnly start)
                && TimeOnly.TryParse(todaySchedule.EndTime, out TimeOnly end))
            {
                TimeOnly currentTime = TimeOnly.FromDateTime(now.UtcDateTime);
                return currentTime < start || currentTime > end;
            }

            return false;
        }

        return true;
    }
}

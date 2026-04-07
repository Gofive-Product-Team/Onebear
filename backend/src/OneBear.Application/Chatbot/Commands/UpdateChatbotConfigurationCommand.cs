namespace OneBear.Application.Chatbot.Commands;

public record UpdateChatbotConfigurationCommand(
    string ScheduleMode,
    string? SystemPrompt,
    string? ResponseStyle);

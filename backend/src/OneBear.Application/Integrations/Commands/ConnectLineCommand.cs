namespace OneBear.Application.Integrations.Commands;

public record ConnectLineCommand(string ChannelId, string ChannelSecret, string ChannelAccessToken);

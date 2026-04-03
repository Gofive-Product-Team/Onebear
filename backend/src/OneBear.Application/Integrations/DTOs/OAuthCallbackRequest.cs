namespace OneBear.Application.Integrations.DTOs;

public record OAuthCallbackRequest(string Code, string State, string? ShopId);

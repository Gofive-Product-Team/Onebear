namespace OneBear.Application.Integrations.DTOs;

public record WhatsAppTokenRequest(string AccessToken, string? PhoneNumberId, string? WabaId);

namespace OneBear.Application.Auth.Services;

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneBear.Domain.Common;

public class KeycloakAdminService
{
    private readonly HttpClient _httpClient;
    private readonly KeycloakAdminOptions _options;
    private readonly ILogger<KeycloakAdminService> _logger;

    private string? _cachedToken;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    public KeycloakAdminService(
        HttpClient httpClient,
        IOptions<KeycloakAdminOptions> options,
        ILogger<KeycloakAdminService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Creates a user in Keycloak. Returns the Keycloak user ID on success.
    /// Returns Result.Failure with "USER_EXISTS" if 409 Conflict.
    /// </summary>
    public async Task<Result<string>> CreateUserAsync(
        string email,
        string password,
        string? displayName,
        CancellationToken ct)
    {
        string token = await GetServiceAccountTokenAsync(ct);

        var payload = new
        {
            username = email,
            email,
            firstName = displayName ?? "",
            enabled = true,
            emailVerified = true,
            credentials = new[]
            {
                new { type = "password", value = password, temporary = false }
            }
        };

        using HttpRequestMessage request = new(HttpMethod.Post, $"{_options.AdminBaseUrl}/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(payload);

        HttpResponseMessage response = await _httpClient.SendAsync(request, ct);

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogWarning("Keycloak user already exists: {Email}", email);
            return new Result<string>.Failure(
                new Error("USER_EXISTS", "A user with this email already exists in Keycloak.", ErrorType.Conflict));
        }

        if (!response.IsSuccessStatusCode)
        {
            string body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Keycloak create user failed: {Status} {Body}", response.StatusCode, body);
            return new Result<string>.Failure(
                new Error("KEYCLOAK_ERROR", $"Failed to create Keycloak user: {response.StatusCode}", ErrorType.Internal));
        }

        // Extract user ID from Location header: .../users/{id}
        string? location = response.Headers.Location?.AbsolutePath;
        if (string.IsNullOrEmpty(location))
        {
            _logger.LogError("Keycloak create user returned no Location header");
            return new Result<string>.Failure(
                new Error("KEYCLOAK_ERROR", "Keycloak did not return a user ID.", ErrorType.Internal));
        }

        string keycloakUserId = location.Split('/').Last();
        _logger.LogInformation("Created Keycloak user {UserId} for {Email}", keycloakUserId, email);

        return new Result<string>.Success(keycloakUserId);
    }

    /// <summary>
    /// Looks up a Keycloak user by exact email match.
    /// </summary>
    public async Task<Result<KeycloakUser?>> GetUserByEmailAsync(string email, CancellationToken ct)
    {
        string token = await GetServiceAccountTokenAsync(ct);

        string encodedEmail = Uri.EscapeDataString(email);
        using HttpRequestMessage request = new(HttpMethod.Get,
            $"{_options.AdminBaseUrl}/users?email={encodedEmail}&exact=true");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response = await _httpClient.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            string body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Keycloak get user by email failed: {Status} {Body}", response.StatusCode, body);
            return new Result<KeycloakUser?>.Failure(
                new Error("KEYCLOAK_ERROR", $"Failed to query Keycloak users: {response.StatusCode}", ErrorType.Internal));
        }

        List<KeycloakUser>? users = await response.Content.ReadFromJsonAsync<List<KeycloakUser>>(
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct);

        KeycloakUser? user = users?.FirstOrDefault();
        return new Result<KeycloakUser?>.Success(user);
    }

    /// <summary>
    /// Obtains a service account token via client_credentials grant.
    /// Caches the token until 30 seconds before expiry.
    /// </summary>
    private async Task<string> GetServiceAccountTokenAsync(CancellationToken ct)
    {
        if (_cachedToken is not null && DateTimeOffset.UtcNow < _tokenExpiresAt)
        {
            return _cachedToken;
        }

        await _tokenLock.WaitAsync(ct);
        try
        {
            // Double-check after acquiring lock
            if (_cachedToken is not null && DateTimeOffset.UtcNow < _tokenExpiresAt)
            {
                return _cachedToken;
            }

            Dictionary<string, string> formData = new()
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret
            };

            using FormUrlEncodedContent content = new(formData);
            HttpResponseMessage response = await _httpClient.PostAsync(_options.TokenUrl, content, ct);

            if (!response.IsSuccessStatusCode)
            {
                string body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Failed to obtain Keycloak service account token: {Status} {Body}",
                    response.StatusCode, body);
                throw new InvalidOperationException(
                    $"Failed to obtain Keycloak service account token: {response.StatusCode}");
            }

            TokenResponse? tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct);

            if (tokenResponse is null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                throw new InvalidOperationException("Keycloak token response was empty.");
            }

            _cachedToken = tokenResponse.AccessToken;
            // Cache until 30 seconds before expiry
            _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokenResponse.ExpiresIn - 30);

            _logger.LogDebug("Obtained Keycloak service account token, expires in {ExpiresIn}s",
                tokenResponse.ExpiresIn);

            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private sealed class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = "";

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = "";
    }
}

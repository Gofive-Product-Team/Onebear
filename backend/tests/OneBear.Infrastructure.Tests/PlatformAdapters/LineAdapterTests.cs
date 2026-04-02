namespace OneBear.Infrastructure.Tests.PlatformAdapters;

using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.ValueObjects;
using OneBear.Infrastructure.PlatformAdapters;

public class LineAdapterTests
{
    #region Helpers

    private static IntegrationChannel CreateIntegration(
        string secret = "test-channel-secret",
        string token = "test-access-token") => new()
    {
        Id = "int-001",
        CompanyId = "company-001",
        Platform = SocialPlatform.Line,
        IsActive = true,
        HasChatFeature = true,
        Credentials = new PlatformCredentials
        {
            ChannelId = "line-channel-001",
            ChannelSecret = secret,
            AccessToken = token
        }
    };

    private static string ComputeLineSignature(string body, string channelSecret)
    {
        byte[] bodyBytes = Encoding.UTF8.GetBytes(body);
        using HMACSHA256 hmac = new(Encoding.UTF8.GetBytes(channelSecret));
        byte[] hash = hmac.ComputeHash(bodyBytes);
        return Convert.ToBase64String(hash);
    }

    private static LineAdapter CreateAdapter(IHttpClientFactory? factory = null)
    {
        IHttpClientFactory httpFactory = factory ?? Mock.Of<IHttpClientFactory>();
        ILogger<LineAdapter> logger = Mock.Of<ILogger<LineAdapter>>();
        return new LineAdapter(httpFactory, logger);
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;
        public HttpRequestMessage? CapturedRequest { get; private set; }
        public string? CapturedBody { get; private set; }

        public MockHttpMessageHandler(HttpResponseMessage response) => _response = response;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct)
        {
            CapturedRequest = request;
            if (request.Content is not null)
                CapturedBody = await request.Content.ReadAsStringAsync(ct);
            return _response;
        }
    }

    #endregion

    #region ValidateWebhookSignature

    [Fact]
    public async Task ValidateWebhookSignature_ShouldSucceed_WithValidSignature()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();
        string jsonBody = """{"events":[{"type":"message"}]}""";
        byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);
        string signature = ComputeLineSignature(jsonBody, "test-channel-secret");

        Dictionary<string, string> headers = new()
        {
            { "X-Line-Signature", signature }
        };

        // Act
        Result<WebhookValidationResult> result =
            await adapter.ValidateWebhookSignatureAsync(bodyBytes, headers, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<WebhookValidationResult>.Success>(result);
        Result<WebhookValidationResult>.Success success = (Result<WebhookValidationResult>.Success)result;
        Assert.True(success.Value.IsValid);
    }

    [Fact]
    public async Task ValidateWebhookSignature_ShouldFail_WithInvalidSignature()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();
        string jsonBody = """{"events":[{"type":"message"}]}""";
        byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);

        Dictionary<string, string> headers = new()
        {
            { "X-Line-Signature", "aW52YWxpZC1zaWduYXR1cmU=" }
        };

        // Act
        Result<WebhookValidationResult> result =
            await adapter.ValidateWebhookSignatureAsync(bodyBytes, headers, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<WebhookValidationResult>.Failure>(result);
        Result<WebhookValidationResult>.Failure failure = (Result<WebhookValidationResult>.Failure)result;
        Assert.Equal("INVALID_SIGNATURE", failure.Error.Code);
    }

    [Fact]
    public async Task ValidateWebhookSignature_ShouldFail_WithMissingHeader()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();
        byte[] bodyBytes = Encoding.UTF8.GetBytes("{}");

        Dictionary<string, string> headers = new(); // no X-Line-Signature

        // Act
        Result<WebhookValidationResult> result =
            await adapter.ValidateWebhookSignatureAsync(bodyBytes, headers, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<WebhookValidationResult>.Failure>(result);
        Result<WebhookValidationResult>.Failure failure = (Result<WebhookValidationResult>.Failure)result;
        Assert.Equal("MISSING_SIGNATURE", failure.Error.Code);
    }

    #endregion

    #region ParseInboundMessage

    [Fact]
    public async Task ParseInboundMessage_ShouldMapTextMessage()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();

        string json = """
        {
          "events": [{
            "type": "message",
            "replyToken": "test-reply-token",
            "source": { "type": "user", "userId": "U1234567890" },
            "timestamp": 1625000000000,
            "message": { "type": "text", "id": "msg123", "text": "Hello" }
          }]
        }
        """;
        using JsonDocument payload = JsonDocument.Parse(json);

        // Act
        Result<NormalizedMessage> result =
            await adapter.ParseInboundMessageAsync(payload, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<NormalizedMessage>.Success>(result);
        NormalizedMessage message = ((Result<NormalizedMessage>.Success)result).Value;
        Assert.Equal("Hello", message.Content);
        Assert.Equal(MessageType.Text, message.MessageType);
        Assert.Equal("U1234567890", message.ExternalUserId);
        Assert.Equal("msg123", message.PlatformMessageId);
        Assert.Equal(1625000000000, message.Timestamp);
        Assert.False(message.IsEcho);
    }

    [Fact]
    public async Task ParseInboundMessage_ShouldMapImageMessage()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();

        string json = """
        {
          "events": [{
            "type": "message",
            "replyToken": "test-reply-token",
            "source": { "type": "user", "userId": "U1234567890" },
            "timestamp": 1625000000000,
            "message": { "type": "image", "id": "img456" }
          }]
        }
        """;
        using JsonDocument payload = JsonDocument.Parse(json);

        // Act
        Result<NormalizedMessage> result =
            await adapter.ParseInboundMessageAsync(payload, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<NormalizedMessage>.Success>(result);
        NormalizedMessage message = ((Result<NormalizedMessage>.Success)result).Value;
        Assert.Equal(MessageType.Image, message.MessageType);
        Assert.NotNull(message.Attachment);
        Assert.Contains("img456", message.Attachment.FileUrl);
        Assert.Contains("/content", message.Attachment.FileUrl);
        Assert.Equal("img456.jpg", message.Attachment.FileName);
        Assert.Equal("image", message.Attachment.ContentType);
    }

    [Fact]
    public async Task ParseInboundMessage_ShouldMapStickerMessage()
    {
        // Arrange
        LineAdapter adapter = CreateAdapter();
        IntegrationChannel integration = CreateIntegration();

        string json = """
        {
          "events": [{
            "type": "message",
            "replyToken": "test-reply-token",
            "source": { "type": "user", "userId": "U1234567890" },
            "timestamp": 1625000000000,
            "message": { "type": "sticker", "id": "stk789", "packageId": "11537", "stickerId": "52002734" }
          }]
        }
        """;
        using JsonDocument payload = JsonDocument.Parse(json);

        // Act
        Result<NormalizedMessage> result =
            await adapter.ParseInboundMessageAsync(payload, integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<NormalizedMessage>.Success>(result);
        NormalizedMessage message = ((Result<NormalizedMessage>.Success)result).Value;
        Assert.Equal(MessageType.Sticker, message.MessageType);
        Assert.Contains("11537", message.Content);
        Assert.Contains("52002734", message.Content);
        Assert.Equal("sticker:11537:52002734", message.Content);
    }

    #endregion

    #region SendTextAsync

    [Fact]
    public async Task SendTextAsync_ShouldCallPushEndpoint()
    {
        // Arrange
        MockHttpMessageHandler handler = new(new HttpResponseMessage(HttpStatusCode.OK));
        HttpClient client = new(handler);

        Mock<IHttpClientFactory> factoryMock = new();
        factoryMock.Setup(f => f.CreateClient("line-api")).Returns(client);

        LineAdapter adapter = CreateAdapter(factoryMock.Object);
        IntegrationChannel integration = CreateIntegration();

        // Act
        await adapter.SendTextAsync("U1234567890", "Hi there", integration, CancellationToken.None);

        // Assert
        Assert.NotNull(handler.CapturedRequest);
        Assert.Equal(HttpMethod.Post, handler.CapturedRequest.Method);
        Assert.Equal("https://api.line.me/v2/bot/message/push", handler.CapturedRequest.RequestUri?.ToString());
        Assert.NotNull(handler.CapturedBody);
        Assert.Contains("U1234567890", handler.CapturedBody);
        Assert.Contains("Hi there", handler.CapturedBody);
        Assert.Contains("\"type\":\"text\"", handler.CapturedBody);

        // Verify Bearer token is set
        Assert.Equal("Bearer", handler.CapturedRequest.Headers.Authorization?.Scheme);
        Assert.Equal("test-access-token", handler.CapturedRequest.Headers.Authorization?.Parameter);
    }

    [Fact]
    public async Task SendTextAsync_ShouldReturnSuccess_WhenOkResponse()
    {
        // Arrange
        MockHttpMessageHandler handler = new(new HttpResponseMessage(HttpStatusCode.OK));
        HttpClient client = new(handler);

        Mock<IHttpClientFactory> factoryMock = new();
        factoryMock.Setup(f => f.CreateClient("line-api")).Returns(client);

        LineAdapter adapter = CreateAdapter(factoryMock.Object);
        IntegrationChannel integration = CreateIntegration();

        // Act
        Result<PlatformSendResult> result =
            await adapter.SendTextAsync("U1234567890", "Hello", integration, CancellationToken.None);

        // Assert
        Assert.IsType<Result<PlatformSendResult>.Success>(result);
        PlatformSendResult sendResult = ((Result<PlatformSendResult>.Success)result).Value;
        Assert.True(sendResult.Success);
        Assert.Null(sendResult.ErrorMessage);
    }

    #endregion
}

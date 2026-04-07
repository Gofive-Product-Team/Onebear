using FluentValidation.Results;
using OneBear.Application.Chatbot.Commands;
using OneBear.Application.Chatbot.Validators;
using OneBear.Application.Integrations.Commands;
using OneBear.Application.Integrations.Validators;
using OneBear.Application.Messaging.Commands;
using OneBear.Application.Messaging.Validators;
using OneBear.Application.Rooms.Commands;
using OneBear.Application.Rooms.Validators;

namespace OneBear.API.Tests.Validators;

public class SendMessageCommandValidatorTests
{
    private readonly SendMessageCommandValidator _validator = new();

    [Fact]
    public void Validate_ShouldFail_WhenRoomIdIsEmpty()
    {
        SendMessageCommand command = new(
            RoomId: "",
            Content: "hello",
            MessageType: null,
            AttachmentId: null,
            MentionedUserIds: null);

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "RoomId");
    }

    [Fact]
    public void Validate_ShouldFail_WhenContentEmptyAndNoAttachment()
    {
        SendMessageCommand command = new(
            RoomId: "room-1",
            Content: "",
            MessageType: null,
            AttachmentId: null,
            MentionedUserIds: null);

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Content"
            && e.ErrorMessage == "Content is required when no attachment is provided.");
    }

    [Fact]
    public void Validate_ShouldPass_WhenContentEmptyButAttachmentProvided()
    {
        SendMessageCommand command = new(
            RoomId: "room-1",
            Content: "",
            MessageType: null,
            AttachmentId: "att-123",
            MentionedUserIds: null);

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_ShouldFail_WhenContentExceedsMaxLength()
    {
        string longContent = new('a', 10001);
        SendMessageCommand command = new(
            RoomId: "room-1",
            Content: longContent,
            MessageType: null,
            AttachmentId: null,
            MentionedUserIds: null);

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Content"
            && e.ErrorMessage == "Content must be less than 10000 characters.");
    }

    [Fact]
    public void Validate_ShouldPass_WhenContentAtMaxLength()
    {
        string maxContent = new('a', 10000);
        SendMessageCommand command = new(
            RoomId: "room-1",
            Content: maxContent,
            MessageType: null,
            AttachmentId: null,
            MentionedUserIds: null);

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_ShouldPass_WhenAllFieldsValid()
    {
        SendMessageCommand command = new(
            RoomId: "room-1",
            Content: "Hello world",
            MessageType: "text",
            AttachmentId: null,
            MentionedUserIds: ["user-1"]);

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}

public class UpdateRoomAssignmentCommandValidatorTests
{
    private readonly UpdateRoomAssignmentCommandValidator _validator = new();

    [Fact]
    public void Validate_ShouldFail_WhenAssignToUserIdIsEmpty()
    {
        UpdateRoomAssignmentCommand command = new(AssignToUserId: "");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "AssignToUserId"
            && e.ErrorMessage == "AssignToUserId is required.");
    }

    [Fact]
    public void Validate_ShouldFail_WhenAssignToUserIdIsWhitespace()
    {
        UpdateRoomAssignmentCommand command = new(AssignToUserId: "   ");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "AssignToUserId");
    }

    [Fact]
    public void Validate_ShouldPass_WhenAssignToUserIdProvided()
    {
        UpdateRoomAssignmentCommand command = new(AssignToUserId: "user-123");

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}

public class ConnectLineCommandValidatorTests
{
    private readonly ConnectLineCommandValidator _validator = new();

    [Fact]
    public void Validate_ShouldFail_WhenChannelIdIsEmpty()
    {
        ConnectLineCommand command = new(
            ChannelId: "",
            ChannelSecret: "secret",
            ChannelAccessToken: "token");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ChannelId"
            && e.ErrorMessage == "ChannelId is required.");
    }

    [Fact]
    public void Validate_ShouldFail_WhenChannelSecretIsEmpty()
    {
        ConnectLineCommand command = new(
            ChannelId: "channel-1",
            ChannelSecret: "",
            ChannelAccessToken: "token");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ChannelSecret"
            && e.ErrorMessage == "ChannelSecret is required.");
    }

    [Fact]
    public void Validate_ShouldFail_WhenChannelAccessTokenIsEmpty()
    {
        ConnectLineCommand command = new(
            ChannelId: "channel-1",
            ChannelSecret: "secret",
            ChannelAccessToken: "");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ChannelAccessToken"
            && e.ErrorMessage == "ChannelAccessToken is required.");
    }

    [Fact]
    public void Validate_ShouldFail_WhenAllFieldsEmpty()
    {
        ConnectLineCommand command = new(
            ChannelId: "",
            ChannelSecret: "",
            ChannelAccessToken: "");

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Equal(3, result.Errors.Count);
    }

    [Fact]
    public void Validate_ShouldPass_WhenAllFieldsProvided()
    {
        ConnectLineCommand command = new(
            ChannelId: "channel-1",
            ChannelSecret: "my-secret",
            ChannelAccessToken: "my-token");

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}

public class UpdateChatbotConfigurationCommandValidatorTests
{
    private readonly UpdateChatbotConfigurationCommandValidator _validator = new();

    [Theory]
    [InlineData("always")]
    [InlineData("businessHours")]
    [InlineData("custom")]
    public void Validate_ShouldPass_WhenScheduleModeIsValid(string scheduleMode)
    {
        UpdateChatbotConfigurationCommand command = new(
            ScheduleMode: scheduleMode,
            SystemPrompt: null,
            ResponseStyle: null);

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("Always")]
    [InlineData("ALWAYS")]
    [InlineData("business_hours")]
    [InlineData("off")]
    [InlineData("unknown")]
    public void Validate_ShouldFail_WhenScheduleModeIsInvalid(string scheduleMode)
    {
        UpdateChatbotConfigurationCommand command = new(
            ScheduleMode: scheduleMode,
            SystemPrompt: null,
            ResponseStyle: null);

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ScheduleMode"
            && e.ErrorMessage == "ScheduleMode must be one of: always, businessHours, custom.");
    }

    [Fact]
    public void Validate_ShouldFail_WhenScheduleModeIsEmpty()
    {
        UpdateChatbotConfigurationCommand command = new(
            ScheduleMode: "",
            SystemPrompt: null,
            ResponseStyle: null);

        ValidationResult result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ScheduleMode"
            && e.ErrorMessage == "ScheduleMode is required.");
    }

    [Fact]
    public void Validate_ShouldPass_WhenOptionalFieldsProvided()
    {
        UpdateChatbotConfigurationCommand command = new(
            ScheduleMode: "always",
            SystemPrompt: "You are a helpful assistant.",
            ResponseStyle: "formal");

        ValidationResult result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}

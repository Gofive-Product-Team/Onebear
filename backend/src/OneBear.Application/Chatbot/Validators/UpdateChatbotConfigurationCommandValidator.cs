using FluentValidation;
using OneBear.Application.Chatbot.Commands;

namespace OneBear.Application.Chatbot.Validators;

public class UpdateChatbotConfigurationCommandValidator : AbstractValidator<UpdateChatbotConfigurationCommand>
{
    private static readonly string[] ValidScheduleModes = ["always", "businessHours", "custom"];

    public UpdateChatbotConfigurationCommandValidator()
    {
        RuleFor(x => x.ScheduleMode)
            .NotEmpty().WithMessage("ScheduleMode is required.")
            .Must(mode => ValidScheduleModes.Contains(mode))
            .WithMessage("ScheduleMode must be one of: always, businessHours, custom.");
    }
}

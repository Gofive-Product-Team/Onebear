using FluentValidation;
using OneBear.Application.Messaging.Commands;

namespace OneBear.Application.Messaging.Validators;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.RoomId)
            .NotEmpty().WithMessage("RoomId is required.");

        RuleFor(x => x.Content)
            .NotEmpty().When(x => string.IsNullOrEmpty(x.AttachmentId))
            .WithMessage("Content is required when no attachment is provided.");

        RuleFor(x => x.Content)
            .MaximumLength(10000)
            .When(x => !string.IsNullOrEmpty(x.Content))
            .WithMessage("Content must be less than 10000 characters.");
    }
}

using FluentValidation;
using OneBear.Application.Integrations.Commands;

namespace OneBear.Application.Integrations.Validators;

public class ConnectLineCommandValidator : AbstractValidator<ConnectLineCommand>
{
    public ConnectLineCommandValidator()
    {
        RuleFor(x => x.ChannelId).NotEmpty().WithMessage("ChannelId is required.");
        RuleFor(x => x.ChannelSecret).NotEmpty().WithMessage("ChannelSecret is required.");
        RuleFor(x => x.ChannelAccessToken).NotEmpty().WithMessage("ChannelAccessToken is required.");
    }
}

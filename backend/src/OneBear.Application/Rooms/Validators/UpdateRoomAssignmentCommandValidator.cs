using FluentValidation;
using OneBear.Application.Rooms.Commands;

namespace OneBear.Application.Rooms.Validators;

public class UpdateRoomAssignmentCommandValidator : AbstractValidator<UpdateRoomAssignmentCommand>
{
    public UpdateRoomAssignmentCommandValidator()
    {
        RuleFor(x => x.AssignToUserId)
            .NotEmpty().WithMessage("AssignToUserId is required.");
    }
}

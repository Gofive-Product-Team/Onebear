using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace OneBear.API.Filters;

public class ValidationFilter<T> : IAsyncActionFilter where T : class
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        T? model = context.ActionArguments.Values.OfType<T>().FirstOrDefault();
        if (model is null)
        {
            await next();
            return;
        }

        IValidator<T>? validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is null)
        {
            await next();
            return;
        }

        ValidationResult result = await validator.ValidateAsync(model);
        if (!result.IsValid)
        {
            Dictionary<string, string[]> errors = result.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                    g => g.Select(e => e.ErrorMessage).ToArray());

            ProblemDetails problemDetails = new()
            {
                Type = "https://onebear.api/problems/validation",
                Title = "Validation Failed",
                Status = 400,
                Detail = "One or more validation errors occurred."
            };
            problemDetails.Extensions["errors"] = errors;

            context.Result = new BadRequestObjectResult(problemDetails);
            return;
        }

        await next();
    }
}

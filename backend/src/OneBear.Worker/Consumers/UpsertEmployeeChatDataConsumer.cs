namespace OneBear.Worker.Consumers;

using MassTransit;

public record UpsertEmployeeChatData(string CompanyId, string EmployeeId, string DisplayName, string? AvatarUrl);

public class UpsertEmployeeChatDataConsumer : IConsumer<UpsertEmployeeChatData>
{
    public Task Consume(ConsumeContext<UpsertEmployeeChatData> context)
    {
        // TODO: implement employee chat data upsert logic
        return Task.CompletedTask;
    }
}

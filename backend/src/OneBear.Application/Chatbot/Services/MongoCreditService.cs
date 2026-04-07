namespace OneBear.Application.Chatbot.Services;

using Microsoft.Extensions.Logging;
using OneBear.Domain.Entities;
using OneBear.Domain.Enums;
using OneBear.Domain.Interfaces;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class MongoCreditService : ICreditService
{
    private readonly IAiCreditRepository _creditRepo;
    private readonly IAiActivityLogger _activityLogger;
    private readonly ISignalRNotifier _signalRNotifier;
    private readonly ILogger<MongoCreditService> _logger;

    public MongoCreditService(
        IAiCreditRepository creditRepo,
        IAiActivityLogger activityLogger,
        ISignalRNotifier signalRNotifier,
        ILogger<MongoCreditService> logger)
    {
        _creditRepo = creditRepo;
        _activityLogger = activityLogger;
        _signalRNotifier = signalRNotifier;
        _logger = logger;
    }

    public async Task<bool> HasCreditAsync(string companyId, CancellationToken ct)
    {
        AiCredit? credit = await _creditRepo.GetByCompanyIdAsync(companyId, ct);
        if (credit is null) return true;
        return credit.CreditUsed < credit.CreditLimit;
    }

    public async Task<CreditStatusDto> GetStatusAsync(string companyId, CancellationToken ct)
    {
        AiCredit? credit = await _creditRepo.GetByCompanyIdAsync(companyId, ct);
        if (credit is null)
            return new CreditStatusDto { CreditLimit = int.MaxValue, CreditUsed = 0, PlanId = "unlimited" };
        return ToDto(credit);
    }

    public async Task<CreditStatusDto> DeductAsync(string companyId, int amount, string reason, string? roomId, CancellationToken ct)
    {
        AiCredit updated = await _creditRepo.IncrementUsedAsync(companyId, amount, ct);
        CreditStatusDto status = ToDto(updated);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId, RoomId = roomId, EventType = "credit_deduct",
            Details = $"{{\"amount\":{amount},\"reason\":\"{reason}\",\"remaining\":{status.CreditRemaining}}}"
        }, ct);

        if (status.Warning != CreditWarningLevel.None)
        {
            await _signalRNotifier.SendToCompanyAsync(companyId, "CreditWarning", new
            {
                warning = status.Warning.ToString(),
                creditRemaining = status.CreditRemaining,
                creditLimit = status.CreditLimit
            }, ct);
        }

        return status;
    }

    public async Task<CreditStatusDto> TopUpAsync(string companyId, int amount, string reason, CancellationToken ct)
    {
        AiCredit? credit = await _creditRepo.GetByCompanyIdAsync(companyId, ct);
        if (credit is null)
            credit = new AiCredit { CompanyId = companyId, CreditLimit = amount, CreditUsed = 0 };
        else
            credit.CreditLimit += amount;

        await _creditRepo.UpsertAsync(credit, ct);

        await _activityLogger.LogAsync(new AiActivityLog
        {
            CompanyId = companyId, EventType = "credit_topup",
            Details = $"{{\"amount\":{amount},\"reason\":\"{reason}\",\"newLimit\":{credit.CreditLimit}}}"
        }, ct);

        return ToDto(credit);
    }

    private static CreditStatusDto ToDto(AiCredit credit)
    {
        int remaining = credit.CreditLimit - credit.CreditUsed;
        double ratio = credit.CreditLimit > 0 ? (double)remaining / credit.CreditLimit : 1;
        CreditWarningLevel warning = ratio switch
        {
            <= 0 => CreditWarningLevel.Exhausted,
            <= 0.10 => CreditWarningLevel.Red10,
            <= 0.20 => CreditWarningLevel.Yellow20,
            _ => CreditWarningLevel.None
        };
        return new CreditStatusDto { CreditLimit = credit.CreditLimit, CreditUsed = credit.CreditUsed, PlanId = credit.PlanId, Warning = warning };
    }
}

namespace OneBear.Application.Integrations.Services;

using Microsoft.Extensions.Logging;
using OneBear.Application.Common.Interfaces;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;
using OneBear.Domain.ValueObjects;

public class ShortcutService
{
    private readonly IIntegrationChannelRepository _integrationRepo;
    private readonly ILogger<ShortcutService> _logger;

    public ShortcutService(
        IIntegrationChannelRepository integrationRepo,
        ILogger<ShortcutService> logger)
    {
        _integrationRepo = integrationRepo;
        _logger = logger;
    }

    public async Task<Result<List<Shortcut>>> ListShortcutsAsync(
        string integrationId, string companyId, string? categoryId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<List<Shortcut>>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        List<Shortcut> shortcuts = integration.Shortcuts;
        if (!string.IsNullOrEmpty(categoryId))
            shortcuts = shortcuts.Where(s => s.CategoryId == categoryId).ToList();

        return new Result<List<Shortcut>>.Success(shortcuts);
    }

    public async Task<Result<Shortcut>> GetShortcutByIdAsync(
        string integrationId, string companyId, string shortcutId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<Shortcut>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        Shortcut? shortcut = integration.Shortcuts.FirstOrDefault(s => s.Id == shortcutId);
        if (shortcut is null)
            return new Result<Shortcut>.Failure(
                new Error("SHORTCUT_NOT_FOUND", "Shortcut not found.", ErrorType.NotFound));

        return new Result<Shortcut>.Success(shortcut);
    }

    public async Task<Result<List<Shortcut>>> SearchByKeywordAsync(
        string integrationId, string companyId, string keyword, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<List<Shortcut>>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        List<Shortcut> matches = integration.Shortcuts
            .Where(s => s.Keyword.Contains(keyword, StringComparison.OrdinalIgnoreCase)
                        || s.Content.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return new Result<List<Shortcut>>.Success(matches);
    }

    public async Task<Result<Shortcut>> AddShortcutAsync(
        string integrationId, string companyId, Shortcut shortcut, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<Shortcut>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        shortcut.Id = Guid.NewGuid().ToString();
        integration.Shortcuts.Add(shortcut);
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _integrationRepo.UpdateAsync(integration, ct);
        _logger.LogInformation("Added shortcut {ShortcutId} to integration {IntegrationId}", shortcut.Id, integrationId);

        return new Result<Shortcut>.Success(shortcut);
    }

    public async Task<Result<Shortcut>> UpdateShortcutAsync(
        string integrationId, string companyId, string shortcutId, Shortcut updated, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<Shortcut>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        int index = integration.Shortcuts.FindIndex(s => s.Id == shortcutId);
        if (index < 0)
            return new Result<Shortcut>.Failure(
                new Error("SHORTCUT_NOT_FOUND", "Shortcut not found.", ErrorType.NotFound));

        updated.Id = shortcutId;
        integration.Shortcuts[index] = updated;
        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _integrationRepo.UpdateAsync(integration, ct);
        _logger.LogInformation("Updated shortcut {ShortcutId} in integration {IntegrationId}", shortcutId, integrationId);

        return new Result<Shortcut>.Success(updated);
    }

    public async Task<Result<bool>> DeleteShortcutAsync(
        string integrationId, string companyId, string shortcutId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<bool>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        int removed = integration.Shortcuts.RemoveAll(s => s.Id == shortcutId);
        if (removed == 0)
            return new Result<bool>.Failure(
                new Error("SHORTCUT_NOT_FOUND", "Shortcut not found.", ErrorType.NotFound));

        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);

        return new Result<bool>.Success(true);
    }

    // ── Shortcut Categories ──────────────────────────────────────────

    public async Task<Result<List<ShortcutCategory>>> ListCategoriesAsync(
        string integrationId, string companyId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<List<ShortcutCategory>>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        return new Result<List<ShortcutCategory>>.Success(integration.ShortcutCategories);
    }

    public async Task<Result<ShortcutCategory>> UpsertCategoryAsync(
        string integrationId, string companyId, ShortcutCategory category, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<ShortcutCategory>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        int existingIndex = integration.ShortcutCategories.FindIndex(c => c.Id == category.Id);
        if (existingIndex >= 0)
        {
            integration.ShortcutCategories[existingIndex] = category;
        }
        else
        {
            if (string.IsNullOrEmpty(category.Id))
                category.Id = Guid.NewGuid().ToString();
            integration.ShortcutCategories.Add(category);
        }

        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);

        return new Result<ShortcutCategory>.Success(category);
    }

    public async Task<Result<bool>> DeleteCategoryAsync(
        string integrationId, string companyId, string categoryId, CancellationToken ct)
    {
        IntegrationChannel? integration = await _integrationRepo.GetByIdAsync(integrationId, companyId, ct);
        if (integration is null)
            return new Result<bool>.Failure(
                new Error("INTEGRATION_NOT_FOUND", "Integration not found.", ErrorType.NotFound));

        int removed = integration.ShortcutCategories.RemoveAll(c => c.Id == categoryId);
        if (removed == 0)
            return new Result<bool>.Failure(
                new Error("CATEGORY_NOT_FOUND", "Shortcut category not found.", ErrorType.NotFound));

        // Remove categoryId reference from shortcuts in that category
        foreach (Shortcut shortcut in integration.Shortcuts.Where(s => s.CategoryId == categoryId))
        {
            shortcut.CategoryId = null;
        }

        integration.UpdatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await _integrationRepo.UpdateAsync(integration, ct);

        return new Result<bool>.Success(true);
    }
}

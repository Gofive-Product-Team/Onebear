namespace OneBear.Application.Onboarding.DTOs;

public record OnboardingStateDto
{
    public string Id { get; init; } = default!;
    public int CurrentStep { get; init; }
    public bool IsCompleted { get; init; }
    public List<OnboardingChannelDto> ConnectedChannels { get; init; } = new();
    public bool TestMessageReceived { get; init; }
    public bool AiEnabled { get; init; }
    public bool SampleProductCreated { get; init; }
    public List<OnboardingProductDto> PendingProducts { get; init; } = new();
    public bool CanAnswerFaq { get; init; }
    public bool CanCloseOrders { get; init; }
    public bool TutorialDismissed { get; init; }
    public List<string> TutorialsDismissed { get; init; } = new();
}

public record OnboardingChannelDto
{
    public string Platform { get; init; } = default!;
    public string? ChannelName { get; init; }
    public string? IntegrationId { get; init; }
    public bool TestMessageReceived { get; init; }
}

public record OnboardingProductDto
{
    public string Name { get; init; } = default!;
    public string Category { get; init; } = "General";
    public decimal Price { get; init; }
    public int? Stock { get; init; }
}

public record ConnectChannelRequest
{
    public string Platform { get; init; } = default!;
    public string? ChannelName { get; init; }
    public string? IntegrationId { get; init; }
}

public record CompleteStep2Request
{
    public List<OnboardingProductDto> Products { get; init; } = new();
}

public record DismissTutorialRequest
{
    public string TutorialKey { get; init; } = default!; // "settings" | "payment" | "products" | "followup"
}

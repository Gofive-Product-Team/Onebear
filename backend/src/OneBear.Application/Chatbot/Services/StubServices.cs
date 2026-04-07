namespace OneBear.Application.Chatbot.Services;

using OneBear.Domain.Common;
using OneBear.Domain.Interfaces;

public class StubOrderService : IOrderService
{
    public Task<Result<AiOrderResult>> CreateOrderAsync(CreateAiOrderCommand cmd, CancellationToken ct)
        => Task.FromResult<Result<AiOrderResult>>(
            new Result<AiOrderResult>.Failure(new Error("NOT_IMPLEMENTED", "Order service not yet implemented.", ErrorType.Internal)));

    public Task<Result<AiOrderResult>> RollbackOrderAsync(string orderId, string companyId, CancellationToken ct)
        => Task.FromResult<Result<AiOrderResult>>(
            new Result<AiOrderResult>.Failure(new Error("NOT_IMPLEMENTED", "Order service not yet implemented.", ErrorType.Internal)));
}

public class StubPaymentLinkService : IPaymentLinkService
{
    public Task<Result<PaymentLinkResult>> GenerateAsync(string companyId, string orderId, decimal amount, int expiryHours, CancellationToken ct)
        => Task.FromResult<Result<PaymentLinkResult>>(
            new Result<PaymentLinkResult>.Failure(new Error("NOT_IMPLEMENTED", "Payment link service not yet implemented.", ErrorType.Internal)));

    public Task<Result<PaymentLinkResult>> GetByOrderIdAsync(string companyId, string orderId, CancellationToken ct)
        => Task.FromResult<Result<PaymentLinkResult>>(
            new Result<PaymentLinkResult>.Failure(new Error("NOT_IMPLEMENTED", "Payment link service not yet implemented.", ErrorType.Internal)));
}

public class StubSlipVerificationService : ISlipVerificationService
{
    public Task<Result<SlipVerificationResult>> VerifyAsync(string companyId, string imageUrl, string orderId, CancellationToken ct)
        => Task.FromResult<Result<SlipVerificationResult>>(
            new Result<SlipVerificationResult>.Failure(new Error("NOT_IMPLEMENTED", "Slip verification service not yet implemented.", ErrorType.Internal)));
}

public class StubProductCatalogService : IProductCatalogService
{
    public Task<Result<List<ProductCatalogItem>>> GetActiveProductsAsync(string companyId, CancellationToken ct)
        => Task.FromResult<Result<List<ProductCatalogItem>>>(
            new Result<List<ProductCatalogItem>>.Success(new List<ProductCatalogItem>()));

    public Task<Result<ProductCatalogItem>> GetProductByIdAsync(string companyId, string productId, CancellationToken ct)
        => Task.FromResult<Result<ProductCatalogItem>>(
            new Result<ProductCatalogItem>.Failure(new Error("NOT_IMPLEMENTED", "Product catalog service not yet implemented.", ErrorType.Internal)));
}

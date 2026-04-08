namespace OneBear.Application.Tests.Slips;

using Microsoft.Extensions.Logging;
using Moq;
using OneBear.Application.Slips.DTOs;
using OneBear.Application.Slips.Services;
using OneBear.Domain.Common;
using OneBear.Domain.Entities;
using OneBear.Domain.Interfaces.Repositories;

public class SlipVerificationManagementServiceTests
{
    private readonly Mock<ISlipVerificationRepository> _slipRepoMock;
    private readonly Mock<ISlipBlacklistRepository> _blacklistRepoMock;
    private readonly Mock<IOrderRepository> _orderRepoMock;
    private readonly Mock<ILogger<SlipVerificationManagementService>> _loggerMock;
    private readonly SlipVerificationManagementService _sut;

    private const string CompanyId = "company-001";
    private const string UserId = "user-001";

    public SlipVerificationManagementServiceTests()
    {
        _slipRepoMock = new Mock<ISlipVerificationRepository>();
        _blacklistRepoMock = new Mock<ISlipBlacklistRepository>();
        _orderRepoMock = new Mock<IOrderRepository>();
        _loggerMock = new Mock<ILogger<SlipVerificationManagementService>>();

        _slipRepoMock.Setup(r => r.CreateAsync(It.IsAny<SlipVerification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SlipVerification s, CancellationToken _) => s);
        _slipRepoMock.Setup(r => r.UpdateAsync(It.IsAny<SlipVerification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SlipVerification s, CancellationToken _) => s);
        _slipRepoMock.Setup(r => r.GetSubmissionCountAsync(It.IsAny<string>(), CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _blacklistRepoMock.Setup(r => r.IsBlacklistedAsync(CompanyId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _sut = new SlipVerificationManagementService(
            _slipRepoMock.Object, _blacklistRepoMock.Object, _orderRepoMock.Object, _loggerMock.Object);
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Submit_ShouldCreateSlipRecord()
    {
        SubmitSlipRequest request = new() { OrderId = "ORD-001", ImageUrl = "https://example.com/slip.jpg" };

        Result<SlipVerificationDto> result = await _sut.SubmitSlipAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Success>(result);
        SlipVerificationDto dto = ((Result<SlipVerificationDto>.Success)result).Value;
        Assert.Equal("ORD-001", dto.OrderId);
        Assert.NotNull(dto.Confidence);
        _slipRepoMock.Verify(r => r.CreateAsync(It.IsAny<SlipVerification>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Submit_ShouldReject_WhenMaxSubmissionsReached()
    {
        _slipRepoMock.Setup(r => r.GetSubmissionCountAsync("ORD-001", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(3);

        SubmitSlipRequest request = new() { OrderId = "ORD-001", ImageUrl = "https://example.com/slip.jpg" };

        Result<SlipVerificationDto> result = await _sut.SubmitSlipAsync(CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Failure>(result);
        Assert.Equal("MAX_SUBMISSIONS", ((Result<SlipVerificationDto>.Failure)result).Error.Code);
    }

    // ─── Review ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Review_ShouldApprove_WhenActionIsApprove()
    {
        SlipVerification slip = CreatePendingSlip("slip-1", "ORD-001");
        _slipRepoMock.Setup(r => r.GetByIdAsync("slip-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(slip);
        _orderRepoMock.Setup(r => r.GetByOrderIdAsync("ORD-001", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Order { Id = "o1", CompanyId = CompanyId, OrderId = "ORD-001", Status = OrderStatus.PendingVerify, Total = 500 });
        _orderRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        ReviewSlipRequest request = new() { Action = "approve" };

        Result<SlipVerificationDto> result = await _sut.ReviewSlipAsync("slip-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Success>(result);
        Assert.Equal(SlipStatus.Approved, ((Result<SlipVerificationDto>.Success)result).Value.Status);
    }

    [Fact]
    public async Task Review_ShouldReject_WithReasonCode()
    {
        SlipVerification slip = CreatePendingSlip("slip-1", "ORD-001");
        _slipRepoMock.Setup(r => r.GetByIdAsync("slip-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(slip);

        ReviewSlipRequest request = new() { Action = "reject", RejectionReasonCode = RejectionReasonCode.WrongAmount, AdminNote = "Amount mismatch" };

        Result<SlipVerificationDto> result = await _sut.ReviewSlipAsync("slip-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Success>(result);
        SlipVerificationDto dto = ((Result<SlipVerificationDto>.Success)result).Value;
        Assert.Equal(SlipStatus.Rejected, dto.Status);
        Assert.Equal(RejectionReasonCode.WrongAmount, dto.RejectionReasonCode);
        Assert.NotNull(dto.RejectionMessage);
    }

    [Fact]
    public async Task Review_ShouldFail_WhenRejectWithoutReason()
    {
        SlipVerification slip = CreatePendingSlip("slip-1", "ORD-001");
        _slipRepoMock.Setup(r => r.GetByIdAsync("slip-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(slip);

        ReviewSlipRequest request = new() { Action = "reject" }; // no reason

        Result<SlipVerificationDto> result = await _sut.ReviewSlipAsync("slip-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Failure>(result);
        Assert.Equal("REASON_REQUIRED", ((Result<SlipVerificationDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Review_ShouldReturnNotFound_WhenSlipMissing()
    {
        _slipRepoMock.Setup(r => r.GetByIdAsync("missing", CompanyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SlipVerification?)null);

        ReviewSlipRequest request = new() { Action = "approve" };

        Result<SlipVerificationDto> result = await _sut.ReviewSlipAsync("missing", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Failure>(result);
        Assert.Equal("SLIP_NOT_FOUND", ((Result<SlipVerificationDto>.Failure)result).Error.Code);
    }

    [Fact]
    public async Task Review_ShouldReject_WhenSlipAlreadyApproved()
    {
        SlipVerification slip = CreatePendingSlip("slip-1", "ORD-001");
        slip.Status = SlipStatus.Approved;
        _slipRepoMock.Setup(r => r.GetByIdAsync("slip-1", CompanyId, It.IsAny<CancellationToken>())).ReturnsAsync(slip);

        ReviewSlipRequest request = new() { Action = "approve" };

        Result<SlipVerificationDto> result = await _sut.ReviewSlipAsync("slip-1", CompanyId, UserId, request, CancellationToken.None);

        Assert.IsType<Result<SlipVerificationDto>.Failure>(result);
        Assert.Equal("INVALID_STATUS", ((Result<SlipVerificationDto>.Failure)result).Error.Code);
    }

    // ─── Rejection Message ───────────────────────────────────────────────────

    [Theory]
    [InlineData(RejectionReasonCode.BlurryImage, "not clear enough")]
    [InlineData(RejectionReasonCode.WrongAmount, "does not match")]
    [InlineData(RejectionReasonCode.WrongAccount, "does not match our payment account")]
    [InlineData(RejectionReasonCode.ExpiredTimestamp, "more than 24 hours")]
    [InlineData(RejectionReasonCode.DuplicateSlip, "already been submitted")]
    [InlineData(RejectionReasonCode.Other, "contact our support")]
    public void GetCustomerMessage_ShouldReturnAppropriateMessage(string code, string expectedFragment)
    {
        string message = Domain.Entities.RejectionReasonCode.GetCustomerMessage(code);
        Assert.Contains(expectedFragment, message);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static SlipVerification CreatePendingSlip(string id, string orderId)
    {
        return new SlipVerification
        {
            Id = id,
            CompanyId = CompanyId,
            OrderId = orderId,
            ImageUrl = "https://example.com/slip.jpg",
            Status = SlipStatus.Pending,
            Confidence = 0.85,
            SubmissionCount = 1,
            CreatedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
        };
    }
}

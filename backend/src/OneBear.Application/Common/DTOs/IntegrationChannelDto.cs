namespace OneBear.Application.Common.DTOs;

public class IntegrationChannelDto
{
    public string Id { get; set; } = default!;
    public string Platform { get; set; } = default!;
    public bool IsActive { get; set; }
    public long CreatedTimestamp { get; set; }
}

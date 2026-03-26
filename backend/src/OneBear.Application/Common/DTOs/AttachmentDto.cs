namespace OneBear.Application.Common.DTOs;

public class AttachmentDto
{
    public string Id { get; set; } = default!;
    public string FileName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public string Url { get; set; } = default!;
    public long SizeInBytes { get; set; }
    public long CreatedTimestamp { get; set; }
}

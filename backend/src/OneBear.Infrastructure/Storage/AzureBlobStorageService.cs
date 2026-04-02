namespace OneBear.Infrastructure.Storage;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Logging;
using OneBear.Domain.Interfaces;

public class AzureBlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(BlobServiceClient blobServiceClient, ILogger<AzureBlobStorageService> logger)
    {
        _blobServiceClient = blobServiceClient;
        _logger = logger;
    }

    public async Task<string> UploadAsync(
        string containerName, string blobName, Stream content,
        string contentType, CancellationToken ct = default)
    {
        BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(cancellationToken: ct);

        BlobClient blob = container.GetBlobClient(blobName);
        BlobHttpHeaders headers = new() { ContentType = contentType };

        await blob.UploadAsync(content, new BlobUploadOptions { HttpHeaders = headers }, ct);

        _logger.LogInformation("Uploaded blob {BlobName} to container {Container}", blobName, containerName);
        return blob.Uri.ToString();
    }

    public async Task<Stream?> DownloadAsync(
        string containerName, string blobName, CancellationToken ct = default)
    {
        BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName);
        BlobClient blob = container.GetBlobClient(blobName);

        if (!await blob.ExistsAsync(ct))
        {
            _logger.LogDebug("Blob {BlobName} not found in {Container}", blobName, containerName);
            return null;
        }

        Azure.Response<BlobDownloadResult> response = await blob.DownloadContentAsync(ct);
        return response.Value.Content.ToStream();
    }

    public async Task DeleteAsync(
        string containerName, string blobName, CancellationToken ct = default)
    {
        BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName);
        BlobClient blob = container.GetBlobClient(blobName);

        await blob.DeleteIfExistsAsync(cancellationToken: ct);
        _logger.LogInformation("Deleted blob {BlobName} from container {Container}", blobName, containerName);
    }

    public Task<string> GetSasUrlAsync(
        string containerName, string blobName, TimeSpan expiry, CancellationToken ct = default)
    {
        BlobContainerClient container = _blobServiceClient.GetBlobContainerClient(containerName);
        BlobClient blob = container.GetBlobClient(blobName);

        if (!blob.CanGenerateSasUri)
        {
            _logger.LogWarning("Cannot generate SAS URI for {BlobName} - BlobServiceClient was not created with shared key credentials", blobName);
            return Task.FromResult(blob.Uri.ToString());
        }

        BlobSasBuilder sasBuilder = new()
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        Uri sasUri = blob.GenerateSasUri(sasBuilder);
        return Task.FromResult(sasUri.ToString());
    }
}

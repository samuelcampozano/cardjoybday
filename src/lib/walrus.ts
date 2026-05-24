import { config } from "@/lib/config";

export async function uploadToWalrus(imageBuffer: Blob): Promise<string> {
  const response = await fetch(
    `${config.walrus.publisherUrl}/v1/blobs?epochs=5`,
    { method: "PUT", body: imageBuffer }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Walrus upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const blobId =
    data.newlyCreated?.blobObject?.blobId ?? data.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error("Blob ID missing from Walrus response");
  }

  return blobId;
}

export async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Failed to fetch image from URL");
  return await response.blob();
}

export function walrusBlobUrl(blobId: string): string {
  return `${config.walrus.aggregatorUrl}/v1/blobs/${blobId}`;
}

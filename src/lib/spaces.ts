/**
 * DigitalOcean Spaces Client
 *
 * S3-compatible object storage for GoBD-compliant document archival
 * Each user gets their own folder for data isolation
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

// Singleton S3 client instance
let client: S3Client | null = null;

/**
 * Initialize and return S3 client for DigitalOcean Spaces
 */
function getSpacesClient(): S3Client | null {
  if (!env.DIGITALOCEAN_SPACES_ENDPOINT || !env.DIGITALOCEAN_SPACES_KEY || !env.DIGITALOCEAN_SPACES_SECRET) {
    console.warn('[Spaces] Configuration incomplete, document upload disabled');
    return null;
  }

  if (client) {
    return client;
  }

  try {
    client = new S3Client({
      endpoint: `https://${env.DIGITALOCEAN_SPACES_ENDPOINT}`,
      region: env.DIGITALOCEAN_SPACES_REGION,
      credentials: {
        accessKeyId: env.DIGITALOCEAN_SPACES_KEY,
        secretAccessKey: env.DIGITALOCEAN_SPACES_SECRET,
      },
      forcePathStyle: false, // Use virtual-hosted-style URLs
    });

    console.log('[Spaces] Client initialized successfully');
    return client;
  } catch (error) {
    console.error('[Spaces] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Generate a unique filename for document
 */
export function generateDocumentFilename(userId: string, extension: 'pdf' | 'png' | 'json'): string {
  const timestamp = Date.now();
  return `${env.DIGITALOCEAN_SPACES_FOLDER}/${userId}/${timestamp}-bewirtungsbeleg.${extension}`;
}

/**
 * Upload PDF document to Spaces
 */
export async function uploadPdfDocument(
  userId: string,
  pdfBuffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<string | null> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] Upload failed: client not configured');
    return null;
  }

  try {
    const filename = generateDocumentFilename(userId, 'pdf');

    await client.send(
      new PutObjectCommand({
        Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
        Key: filename,
        Body: pdfBuffer,
        ContentType: contentType,
        ACL: 'private', // Private by default for security
        Metadata: {
          userId,
          documentType: 'bewirtungsbeleg',
          uploadDate: new Date().toISOString(),
        },
      })
    );

    // Generate public URL (or signed URL if private)
    const url = `https://${env.DIGITALOCEAN_SPACES_BUCKET}.${env.DIGITALOCEAN_SPACES_ENDPOINT}/${filename}`;
    console.log(`[Spaces] PDF uploaded successfully: ${filename}`);

    return url;
  } catch (error) {
    console.error('[Spaces] Error uploading PDF:', error);
    return null;
  }
}

/**
 * Upload PNG preview to Spaces
 */
export async function uploadPngPreview(
  userId: string,
  pngBuffer: Buffer,
  contentType: string = 'image/png'
): Promise<string | null> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] Upload failed: client not configured');
    return null;
  }

  try {
    const filename = generateDocumentFilename(userId, 'png');

    await client.send(
      new PutObjectCommand({
        Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
        Key: filename,
        Body: pngBuffer,
        ContentType: contentType,
        ACL: 'private',
        Metadata: {
          userId,
          documentType: 'bewirtungsbeleg-preview',
          uploadDate: new Date().toISOString(),
        },
      })
    );

    const url = `https://${env.DIGITALOCEAN_SPACES_BUCKET}.${env.DIGITALOCEAN_SPACES_ENDPOINT}/${filename}`;
    console.log(`[Spaces] PNG preview uploaded successfully: ${filename}`);

    return url;
  } catch (error) {
    console.error('[Spaces] Error uploading PNG:', error);
    return null;
  }
}

/**
 * Upload metadata JSON to Spaces
 */
export async function uploadMetadataJson(
  userId: string,
  metadata: Record<string, any>,
  contentType: string = 'application/json'
): Promise<string | null> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] Upload failed: client not configured');
    return null;
  }

  try {
    const filename = generateDocumentFilename(userId, 'json');
    const jsonBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8');

    await client.send(
      new PutObjectCommand({
        Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
        Key: filename,
        Body: jsonBuffer,
        ContentType: contentType,
        ACL: 'private',
        Metadata: {
          userId,
          documentType: 'bewirtungsbeleg-metadata',
          uploadDate: new Date().toISOString(),
        },
      })
    );

    const url = `https://${env.DIGITALOCEAN_SPACES_BUCKET}.${env.DIGITALOCEAN_SPACES_ENDPOINT}/${filename}`;
    console.log(`[Spaces] Metadata JSON uploaded successfully: ${filename}`);

    return url;
  } catch (error) {
    console.error('[Spaces] Error uploading metadata:', error);
    return null;
  }
}

/**
 * Delete document from Spaces
 */
export async function deleteDocument(fileKey: string): Promise<boolean> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] Delete failed: client not configured');
    return false;
  }

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
        Key: fileKey,
      })
    );

    console.log(`[Spaces] Document deleted successfully: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`[Spaces] Error deleting document ${fileKey}:`, error);
    return false;
  }
}

/**
 * Get document from Spaces
 */
export async function getDocument(fileKey: string): Promise<Buffer | null> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] Get failed: client not configured');
    return null;
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
        Key: fileKey,
      })
    );

    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    console.log(`[Spaces] Document retrieved successfully: ${fileKey}`);

    return buffer;
  } catch (error) {
    console.error(`[Spaces] Error getting document ${fileKey}:`, error);
    return null;
  }
}

/**
 * Generate a public URL for a document
 * Note: This assumes the bucket has public read access configured
 * For private buckets, use signed URLs instead
 */
export function getDocumentUrl(fileKey: string): string {
  return `https://${env.DIGITALOCEAN_SPACES_BUCKET}.${env.DIGITALOCEAN_SPACES_ENDPOINT}/${fileKey}`;
}

/**
 * Upload all document files at once
 * Returns URLs for PDF, PNG, and JSON files
 */
export async function uploadDocumentSet(
  userId: string,
  pdfBuffer: Buffer,
  pngBuffer: Buffer,
  metadata: Record<string, any>
): Promise<{
  pdfUrl: string | null;
  pngUrl: string | null;
  metadataUrl: string | null;
  success: boolean;
} | null> {
  try {
    console.log(`[Spaces] Starting document set upload for user: ${userId}`);

    // Upload all three files in parallel
    const [pdfUrl, pngUrl, metadataUrl] = await Promise.all([
      uploadPdfDocument(userId, pdfBuffer),
      uploadPngPreview(userId, pngBuffer),
      uploadMetadataJson(userId, metadata),
    ]);

    // Check if all uploads succeeded
    const success = !!(pdfUrl && pngUrl && metadataUrl);

    if (success) {
      console.log(`[Spaces] Document set uploaded successfully for user: ${userId}`);
    } else {
      console.error('[Spaces] Some uploads failed in document set');
    }

    return {
      pdfUrl,
      pngUrl,
      metadataUrl,
      success,
    };
  } catch (error) {
    console.error('[Spaces] Error uploading document set:', error);
    return null;
  }
}

/**
 * List all documents for a user
 */
export async function listDocuments(userId: string): Promise<string[]> {
  const client = getSpacesClient();
  if (!client || !env.DIGITALOCEAN_SPACES_BUCKET) {
    console.warn('[Spaces] List failed: client not configured');
    return [];
  }

  try {
    // Import ListObjectsV2Command inside the function to avoid build issues with serverless
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');

    const prefix = `${env.DIGITALOCEAN_SPACES_FOLDER}/${userId}/`;
    
    const command = new ListObjectsV2Command({
      Bucket: env.DIGITALOCEAN_SPACES_BUCKET,
      Prefix: prefix,
    });

    const response = await client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    // Return the object keys (file paths)
    const files = response.Contents.map(obj => obj.Key!).filter(key => key !== undefined) as string[];
    console.log(`[Spaces] Found ${files.length} documents for user: ${userId}`);
    
    return files;
  } catch (error) {
    console.error(`[Spaces] Error listing documents for user ${userId}:`, error);
    return [];
  }
}

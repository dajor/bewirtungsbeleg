/**
 * Mock DigitalOcean Spaces utilities for testing
 */

export const mockSpacesEndpoint = 'fra1.digitaloceanspaces.com';
export const mockBucketName = 'test-bucket';
export const mockSpacesFolder = 'test-documents';

export const mockPdfUrl = `https://${mockBucketName}.${mockSpacesEndpoint}/${mockSpacesFolder}/user-1/1710518400000-bewirtungsbeleg.pdf`;
export const mockPngUrl = `https://${mockBucketName}.${mockSpacesEndpoint}/${mockSpacesFolder}/user-1/1710518400000-bewirtungsbeleg.png`;
export const mockMetadataUrl = `https://${mockBucketName}.${mockSpacesEndpoint}/${mockSpacesFolder}/user-1/1710518400000-bewirtungsbeleg.json`;

export const mockUploadResult = {
  pdfUrl: mockPdfUrl,
  pngUrl: mockPngUrl,
  metadataUrl: mockMetadataUrl,
  success: true,
};

export const mockFailedUploadResult = {
  pdfUrl: null,
  pngUrl: null,
  metadataUrl: null,
  success: false,
};

/**
 * Create mock S3 send response
 */
export function createMockS3Response(success: boolean = true) {
  if (success) {
    return {
      $metadata: {
        httpStatusCode: 200,
      },
      ETag: '"abc123"',
    };
  }
  throw new Error('S3 upload failed');
}

/**
 * Create mock PDF buffer
 */
export function createMockPdfBuffer(): Buffer {
  return Buffer.from('PDF-1.4 mock content');
}

/**
 * Create mock PNG buffer
 */
export function createMockPngBuffer(): Buffer {
  return Buffer.from('PNG mock content');
}

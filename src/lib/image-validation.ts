/**
 * Image validation utilities
 * Ensures images are properly formatted before sending to external APIs
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  format?: 'jpeg' | 'png' | 'gif' | 'webp';
  base64Data?: string;
}

/**
 * Validate and normalize a data URL image
 * Returns the validated base64 data and format
 */
export function validateImageDataUrl(dataUrl: string): ImageValidationResult {
  try {
    // Check if it's a valid data URL format
    if (!dataUrl.startsWith('data:')) {
      return {
        valid: false,
        error: 'Invalid data URL format - must start with "data:"'
      };
    }

    // Extract the MIME type and base64 data
    const matches = dataUrl.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      return {
        valid: false,
        error: 'Invalid image data URL format'
      };
    }

    let format = matches[1];
    // Normalize jpg to jpeg
    if (format === 'jpg') {
      format = 'jpeg';
    }

    const base64Data = matches[2];

    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      return {
        valid: false,
        error: 'Empty base64 data'
      };
    }

    // Check if base64 string is valid (basic check)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      return {
        valid: false,
        error: 'Invalid base64 encoding'
      };
    }

    // Verify the image header matches the format
    const imageHeader = base64Data.substring(0, 20);
    const isValidHeader = validateImageHeader(imageHeader, format);

    if (!isValidHeader) {
      console.warn(`Image header doesn't match declared format: ${format}`);
      // Don't fail on header mismatch, just warn
    }

    return {
      valid: true,
      format: format as 'jpeg' | 'png' | 'gif' | 'webp',
      base64Data
    };

  } catch (error) {
    return {
      valid: false,
      error: `Image validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate image header (first few bytes) matches the declared format
 */
function validateImageHeader(base64Header: string, format: string): boolean {
  try {
    // Decode first few bytes to check magic numbers
    const binaryString = atob(base64Header);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check magic numbers for different formats
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        // JPEG starts with FF D8 FF
        return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

      case 'png':
        // PNG starts with 89 50 4E 47 0D 0A 1A 0A
        return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

      case 'gif':
        // GIF starts with "GIF" (47 49 46)
        return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;

      case 'webp':
        // WebP has "RIFF" at start and "WEBP" at offset 8
        return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating image header:', error);
    return false;
  }
}

/**
 * Re-encode a data URL to ensure proper formatting
 * This can fix some encoding issues
 */
export function reencodeImageDataUrl(dataUrl: string): string {
  const validation = validateImageDataUrl(dataUrl);

  if (!validation.valid || !validation.format || !validation.base64Data) {
    throw new Error(validation.error || 'Invalid image data URL');
  }

  // Reconstruct the data URL with normalized format
  return `data:image/${validation.format};base64,${validation.base64Data}`;
}

/**
 * Get image size from base64 data (approximate)
 */
export function getBase64ImageSize(base64Data: string): number {
  // Remove padding characters
  const padding = (base64Data.match(/=/g) || []).length;
  // Calculate approximate size in bytes
  return (base64Data.length * 3) / 4 - padding;
}

/**
 * Validate image size is within acceptable limits
 */
export function validateImageSize(base64Data: string, maxSizeBytes: number = 20 * 1024 * 1024): boolean {
  const size = getBase64ImageSize(base64Data);
  return size <= maxSizeBytes;
}

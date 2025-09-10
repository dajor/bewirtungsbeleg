/**
 * Image Processing Service for DigitalOcean Serverless Function
 */

export interface ImageOperation {
  type: 'rotate' | 'deskew' | 'crop';
  angle?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ProcessImageRequest {
  image: string;
  operations: ImageOperation[];
  format?: 'jpeg' | 'png';
}

export interface ProcessImageResponse {
  success: boolean;
  image?: string;
  format?: string;
  operations_applied?: ImageOperation[];
  error?: string;
}

export class ImageProcessor {
  private static readonly API_URL = 
    'https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-1ee690d7-6035-48e3-9a81-87bf81bdb74b/image-processor/image-processor';

  /**
   * Convert File to Base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:image/...;base64, prefix
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = reject;
    });
  }

  /**
   * Convert Base64 to Blob URL
   */
  static base64ToBlobUrl(base64: string, format: string = 'jpeg'): string {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${format}` });
    return URL.createObjectURL(blob);
  }

  /**
   * Process image with operations
   */
  static async processImage(
    imageFile: File, 
    operations: ImageOperation[]
  ): Promise<string> {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          operations: operations,
          format: 'jpeg'
        } as ProcessImageRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: ProcessImageResponse = await response.json();
      
      if (data.success && data.image) {
        return this.base64ToBlobUrl(data.image, data.format);
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Rotate image by angle
   */
  static async rotateImage(imageFile: File, angle: number): Promise<string> {
    return this.processImage(imageFile, [
      { type: 'rotate', angle }
    ]);
  }

  /**
   * Deskew image (auto-straighten)
   */
  static async deskewImage(imageFile: File): Promise<string> {
    return this.processImage(imageFile, [
      { type: 'deskew' }
    ]);
  }

  /**
   * Crop image
   */
  static async cropImage(
    imageFile: File, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<string> {
    return this.processImage(imageFile, [
      { type: 'crop', x, y, width, height }
    ]);
  }

  /**
   * Apply multiple operations in sequence
   */
  static async applyOperations(
    imageFile: File,
    operations: ImageOperation[]
  ): Promise<string> {
    return this.processImage(imageFile, operations);
  }
}
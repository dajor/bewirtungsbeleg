/**
 * PDF to Image Converter
 * Handles conversion of PDF files to images for display and manipulation
 */

export class PDFToImageConverter {
  /**
   * Convert PDF to image using client-side PDF.js + DigitalOcean function for processing
   * (Hybrid approach: PDF.js converts PDF to image, then bewirt-func processes the image)
   */
  static async convertWithDigitalOcean(
    pdfFile: File,
    page: number = 1,
    operations: Array<{type: string, [key: string]: any}> = []
  ): Promise<string> {
    const API_URL =
      'https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-1ee690d7-6035-48e3-9a81-87bf81bdb74b/image-processor/image-processor';

    try {
      // Step 1: Convert PDF to image on client-side using PDF.js
      const { convertPdfPageToImage } = await import('@/lib/client-pdf-converter');
      const imageDataUrl = await convertPdfPageToImage(pdfFile, page, { scale: 2.0 });

      // Extract base64 from data URL (remove "data:image/jpeg;base64," prefix)
      const base64Image = imageDataUrl.split(',')[1];

      // Step 2: Send the converted image to bewirt-func for processing (if operations specified)
      if (operations.length > 0) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            operations: operations,
            format: 'jpeg'
          })
        });

        if (!response.ok) {
          throw new Error(`Image processing failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.image) {
          return `data:image/jpeg;base64,${data.image}`;
        } else {
          throw new Error(data.error || 'Image processing failed');
        }
      } else {
        // No processing needed, return the converted image directly
        return imageDataUrl;
      }
    } catch (error) {
      console.error('PDF conversion + processing error:', error);
      throw error;
    }
  }

  /**
   * Convert PDF to image using existing /api/convert-pdf endpoint
   * (Server-side conversion using pdftoppm - reliable and consistent)
   */
  static async convertWithLocalAPI(pdfFile: File, page?: number): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      // Add page parameter if specified
      if (page !== undefined) {
        formData.append('page', page.toString());
      }

      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Conversion failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.image) {
        // The API returns a complete data URL (data:image/jpeg;base64,...)
        return result.image;
      } else {
        throw new Error('No image data in response');
      }
    } catch (error) {
      console.error('Local PDF conversion error:', error);
      throw error;
    }
  }

  /**
   * Client-side PDF to image conversion using PDF.js
   * (Pure client-side fallback option)
   */
  static async convertClientSide(pdfFile: File, page: number = 1): Promise<string> {
    try {
      // Use our existing client-side converter
      const { convertPdfPageToImage } = await import('@/lib/client-pdf-converter');
      return await convertPdfPageToImage(pdfFile, page, { scale: 2.0 });
    } catch (error) {
      console.error('Client-side PDF conversion error:', error);
      throw new Error(`Client-side PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main conversion method with fallback strategies
   * DEFAULT: Use server-side conversion (local API) for reliability
   */
  static async convert(pdfFile: File, options?: {
    method?: 'digitalocean' | 'local' | 'client';
    page?: number;
    operations?: Array<{type: string, [key: string]: any}>;
  }): Promise<string> {
    const method = options?.method || 'local'; // DEFAULT: Server-side (most reliable)
    const page = options?.page || 1;
    const operations = options?.operations || [];

    try {
      switch (method) {
        case 'local':
          // Use local API endpoint (server-side conversion with pdftoppm)
          console.log(`🔄 Converting PDF using server-side API (page ${page})...`);
          return await this.convertWithLocalAPI(pdfFile, page);

        case 'digitalocean':
          // Use DigitalOcean function with client-side PDF conversion
          return await this.convertWithDigitalOcean(pdfFile, page, operations);

        case 'client':
          // Client-side conversion only (no backend processing)
          // WARNING: This is unreliable and should only be used as last resort
          console.warn('⚠️ Using client-side PDF conversion (unreliable)');
          return await this.convertClientSide(pdfFile, page);

        default:
          // Default to server-side
          return await this.convertWithLocalAPI(pdfFile, page);
      }
    } catch (error) {
      console.error(`PDF conversion failed with method ${method}:`, error);

      // NO fallback to client-side - it's broken and causes the Object.defineProperty error
      // Just fail cleanly and let the user know
      throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf';
  }

  /**
   * Get PDF page count (requires server-side processing)
   */
  static async getPageCount(pdfFile: File): Promise<number> {
    // This would need to be implemented on the server
    // For now, return 1 as we only process the first page
    return 1;
  }

  // Utility methods
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
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

  private static base64ToBlobUrl(base64: string, format: string = 'png'): string {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${format}` });
    return URL.createObjectURL(blob);
  }
}

// Export for use in components
export default PDFToImageConverter;
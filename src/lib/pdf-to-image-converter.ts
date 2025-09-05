/**
 * PDF to Image Converter
 * Handles conversion of PDF files to images for display and manipulation
 */

export class PDFToImageConverter {
  /**
   * Convert PDF to image using the DigitalOcean function
   * (Once the function is updated to support PDF conversion)
   */
  static async convertWithDigitalOcean(
    pdfFile: File,
    page: number = 1
  ): Promise<string> {
    const API_URL = 
      'https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-1ee690d7-6035-48e3-9a81-87bf81bdb74b/image-processor/image-processor';
    
    try {
      // Convert PDF to base64
      const base64Pdf = await this.fileToBase64(pdfFile);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf: base64Pdf,
          operation: 'pdf_to_image',
          page: page,
          format: 'png'
        })
      });

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        return this.base64ToBlobUrl(data.image, 'png');
      } else {
        throw new Error(data.error || 'PDF conversion failed');
      }
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw error;
    }
  }

  /**
   * Convert PDF to image using existing /api/convert-pdf endpoint
   * (Current implementation)
   */
  static async convertWithLocalAPI(pdfFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      
      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.image) {
        // The API returns base64 image
        return `data:image/png;base64,${result.image}`;
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
   * (Fallback option - requires pdf.js library)
   */
  static async convertClientSide(pdfFile: File): Promise<string> {
    // This would require adding pdf.js to the project
    // Implementation would look like:
    /*
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    return canvas.toDataURL('image/png');
    */
    
    throw new Error('Client-side PDF conversion not yet implemented');
  }

  /**
   * Main conversion method with fallback strategies
   */
  static async convert(pdfFile: File, options?: {
    method?: 'digitalocean' | 'local' | 'client';
    page?: number;
  }): Promise<string> {
    const method = options?.method || 'local';
    const page = options?.page || 1;

    try {
      switch (method) {
        case 'digitalocean':
          // Try DigitalOcean function first (when it's ready)
          return await this.convertWithDigitalOcean(pdfFile, page);
          
        case 'local':
          // Use local API endpoint
          return await this.convertWithLocalAPI(pdfFile);
          
        case 'client':
          // Client-side conversion
          return await this.convertClientSide(pdfFile);
          
        default:
          // Default to local API
          return await this.convertWithLocalAPI(pdfFile);
      }
    } catch (error) {
      console.error(`PDF conversion failed with method ${method}:`, error);
      
      // Try fallback methods
      if (method === 'digitalocean') {
        console.log('Falling back to local API...');
        return await this.convertWithLocalAPI(pdfFile);
      }
      
      throw error;
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
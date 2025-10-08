import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

export interface ConvertedPdfPage {
  pageNumber: number;
  data: string; // base64 data URL
  name: string;
}

/**
 * Convert PDF file to image(s) using PDF.js on the client side
 * This is a fallback when server-side conversion fails
 */
export async function convertPdfToImageClientSide(
  file: File,
  options: {
    scale?: number;
    pageNumber?: number; // Convert specific page (1-indexed), or undefined for all pages
    format?: 'jpeg' | 'png';
    quality?: number;
  } = {}
): Promise<ConvertedPdfPage[]> {
  const {
    scale = 2.0,
    pageNumber,
    format = 'jpeg',
    quality = 0.95
  } = options;

  try {
    console.log('🔄 Starting client-side PDF conversion...');

    // Load PDF document
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdf.numPages;
    console.log(`📄 PDF has ${totalPages} page(s)`);

    const convertedPages: ConvertedPdfPage[] = [];

    // Determine which pages to convert
    const pagesToConvert = pageNumber ? [pageNumber] : Array.from({ length: totalPages }, (_, i) => i + 1);

    for (const pageNum of pagesToConvert) {
      if (pageNum > totalPages) {
        console.warn(`⚠️ Page ${pageNum} does not exist in PDF (total: ${totalPages})`);
        continue;
      }

      console.log(`🖼️ Converting page ${pageNum}...`);

      // Get the page
      const page = await pdf.getPage(pageNum);

      // Calculate viewport
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas 2D context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

      // Convert canvas to base64 data URL
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);

      // Generate page name
      const baseNameWithoutExt = file.name.replace(/\.pdf$/i, '');
      const pageName = totalPages > 1
        ? `${baseNameWithoutExt}_Seite_${pageNum}.${format}`
        : `${baseNameWithoutExt}.${format}`;

      convertedPages.push({
        pageNumber: pageNum,
        data: dataUrl,
        name: pageName
      });

      console.log(`✅ Page ${pageNum} converted successfully`);
    }

    console.log(`✅ Client-side PDF conversion completed: ${convertedPages.length} page(s)`);
    return convertedPages;

  } catch (error) {
    console.error('❌ Client-side PDF conversion failed:', error);
    throw new Error(`Client-side PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a single PDF page to image (returns first page if pageNumber not specified)
 */
export async function convertPdfPageToImage(
  file: File,
  pageNumber: number = 1,
  options: {
    scale?: number;
    format?: 'jpeg' | 'png';
    quality?: number;
  } = {}
): Promise<string> {
  const pages = await convertPdfToImageClientSide(file, {
    ...options,
    pageNumber
  });

  if (pages.length === 0) {
    throw new Error('No pages converted');
  }

  return pages[0].data;
}

/**
 * Check if client-side PDF conversion is supported
 */
export function isClientSidePdfConversionSupported(): boolean {
  return typeof window !== 'undefined' &&
         typeof document !== 'undefined' &&
         'HTMLCanvasElement' in window;
}
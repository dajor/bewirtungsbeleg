import * as pdfjsLib from 'pdfjs-dist';

// Initialize worker - use bundled worker to avoid path/CORS issues
let workerInitialized = false;
let workerInitPromise: Promise<void> | null = null;

async function initializeWorker(): Promise<void> {
  if (workerInitialized) return;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    if (typeof window === 'undefined') return;

    try {
      // Import the worker module directly - Next.js will bundle it properly
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');

      // Create a blob URL from the worker module
      const workerBlob = new Blob(
        [pdfjsWorker.default || pdfjsWorker],
        { type: 'application/javascript' }
      );

      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
      workerInitialized = true;
      console.log('✅ PDF.js worker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PDF.js worker:', error);
      // Fallback to CDN worker as last resort
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      console.log('⚠️ Using CDN fallback worker');
      workerInitialized = true;
    }
  })();

  await workerInitPromise;
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
    console.log(`📁 File: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    // Ensure worker is initialized before processing PDF
    await initializeWorker();

    // Load PDF document
    const arrayBuffer = await file.arrayBuffer();
    console.log('📦 ArrayBuffer created, loading PDF...');

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0 // Reduce console noise
    });

    const pdf = await loadingTask.promise;
    console.log('✅ PDF loaded successfully');

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

      try {
        // Get the page
        const page = await pdf.getPage(pageNum);
        console.log(`📄 Page ${pageNum} loaded`);

        // Calculate viewport
        const viewport = page.getViewport({ scale });
        console.log(`📐 Viewport: ${viewport.width}x${viewport.height}`);

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: false });

        if (!context) {
          throw new Error('Failed to get canvas 2D context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        console.log(`🎨 Canvas created: ${canvas.width}x${canvas.height}`);

        // Render PDF page to canvas
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });

        await renderTask.promise;
        console.log(`✅ Page ${pageNum} rendered to canvas`);

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

      } catch (pageError) {
        console.error(`❌ Failed to convert page ${pageNum}:`, pageError);
        throw new Error(`Page ${pageNum} conversion failed: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
      }
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
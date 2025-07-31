import { NextResponse } from 'next/server';
import { convertPdfToImagesAllPages } from '@/lib/pdf-to-image-multipage';
import { withTimeout } from '../timeout-middleware';

async function handlePOST(request: Request) {
  try {
    console.log('PDF to image conversion API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien werden unterstützt' },
        { status: 400 }
      );
    }
    
    console.log(`Converting PDF: ${file.name}, size: ${file.size} bytes`);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // Try to convert PDF to images (all pages)
      const convertedPages = await convertPdfToImagesAllPages(buffer, file.name);
      
      console.log(`Converted ${convertedPages.length} page(s) from PDF`);
      
      // For OCR, we'll use the first page
      if (convertedPages.length > 0) {
        return NextResponse.json({
          success: true,
          image: convertedPages[0].data,
          pageCount: convertedPages.length,
          allPages: convertedPages // Include all pages for potential future use
        });
      } else {
        return NextResponse.json(
          { error: 'Keine Seiten im PDF gefunden' },
          { status: 400 }
        );
      }
    } catch (pdfError) {
      console.error('Multi-page PDF conversion failed, trying single page fallback:', pdfError);
      
      // Fallback to single page conversion
      const { convertPdfToImage } = await import('@/lib/pdf-to-image');
      const singlePageImage = await convertPdfToImage(buffer, file.name);
      
      if (singlePageImage) {
        return NextResponse.json({
          success: true,
          image: singlePageImage,
          pageCount: 1,
          allPages: [{ pageNumber: 1, data: singlePageImage, name: file.name }]
        });
      } else {
        throw new Error('Beide PDF-Konvertierungsmethoden sind fehlgeschlagen');
      }
    }
    
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Konvertierung: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler') },
      { status: 500 }
    );
  }
}

// Export with timeout wrapper (30 seconds for PDF conversion)
export const POST = withTimeout(handlePOST, 30000);
import { NextResponse } from 'next/server';
import { convertPdfToImagesAllPages } from '@/lib/pdf-to-image-multipage';
import { withTimeout } from '../timeout-middleware';

async function handlePOST(request: Request) {
  try {
    console.log('PDF to image conversion API called');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const formatParam = formData.get('format') as string | null;
    const pageParam = formData.get('page') as string | null;

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

    // Determine format (default to JPEG, but allow PNG via parameter)
    const format = (formatParam === 'png' ? 'png' : 'jpeg') as 'jpeg' | 'png';
    const requestedPage = pageParam ? parseInt(pageParam, 10) : null;
    console.log(`Using format: ${format.toUpperCase()}`, requestedPage ? `page: ${requestedPage}` : 'all pages');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Try to convert PDF to images (all pages) with specified format
      const convertedPages = await convertPdfToImagesAllPages(buffer, file.name, { format });
      
      console.log(`Converted ${convertedPages.length} page(s) from PDF`);

      if (convertedPages.length === 0) {
        return NextResponse.json(
          { error: 'Keine Seiten im PDF gefunden' },
          { status: 400 }
        );
      }

      // If specific page requested, return only that page
      if (requestedPage !== null) {
        const page = convertedPages.find(p => p.pageNumber === requestedPage);

        if (!page) {
          return NextResponse.json(
            { error: `Seite ${requestedPage} existiert nicht (PDF hat ${convertedPages.length} Seite(n))` },
            { status: 404 }
          );
        }

        console.log(`✅ Returning page ${requestedPage} of ${convertedPages.length}`);
        return NextResponse.json({
          success: true,
          image: page.data,
          pageNumber: page.pageNumber,
          totalPages: convertedPages.length
        });
      }

      // Return first page by default (for OCR compatibility)
      return NextResponse.json({
        success: true,
        image: convertedPages[0].data,
        pageCount: convertedPages.length,
        allPages: convertedPages // Include all pages for potential future use
      });
    } catch (pdfError) {
      console.error('PDF conversion failed:', pdfError);

      // Log detailed error for debugging
      if (pdfError instanceof Error) {
        console.error('Error details:', {
          name: pdfError.name,
          message: pdfError.message,
          stack: pdfError.stack?.split('\n').slice(0, 3).join('\n')
        });
      }

      // Re-throw the error for proper error handling
      throw new Error(`PDF conversion failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
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
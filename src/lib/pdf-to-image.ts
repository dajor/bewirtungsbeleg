import { PDFDocument } from 'pdf-lib';

/**
 * Simplified PDF to image conversion without canvas dependency
 * This version creates a simple placeholder image for PDFs
 * For actual PDF rendering, use pdf-to-image-multipage.ts with pdftoppm
 */
export async function convertPdfToImage(pdfBuffer: Buffer, fileName: string): Promise<string> {
  try {
    console.log(`📄 Creating PDF placeholder for: ${fileName}`);

    // Extract PDF info for better placeholder
    const pdfInfo = await extractPdfInfo(pdfBuffer);
    console.log(`✅ PDF has ${pdfInfo.pageCount} page(s)`);

    // Return simple placeholder
    // Note: For actual PDF rendering, the caller should use pdf-to-image-multipage.ts
    return createPdfPlaceholderImage(fileName);

  } catch (error) {
    console.error('PDF info extraction error:', error);
    return createPdfPlaceholderImage(fileName);
  }
}

// Extract information from PDF using pdf-lib
async function extractPdfInfo(pdfBuffer: Buffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Try to get PDF metadata
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    
    console.log(`PDF Info - Pages: ${pageCount}, Title: ${title || 'N/A'}`);
    
    return {
      pageCount,
      title: title || undefined,
      author: author || undefined,
      subject: subject || undefined
    };
  } catch (error) {
    console.error('PDF info extraction failed:', error);
    return { pageCount: 1 };
  }
}


// Create a placeholder image for PDFs when conversion fails
export function createPdfPlaceholderImage(fileName: string): string {
  // Create a simple base64 encoded image showing PDF icon
  // This is a minimal 200x260 JPEG placeholder
  const placeholderBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCACAAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=';
  
  return `data:image/jpeg;base64,${placeholderBase64}`;
}

// Check if a file is a PDF
export function isPdfFile(file: File | string): boolean {
  if (typeof file === 'string') {
    return file.toLowerCase().endsWith('.pdf');
  }
  return file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
}
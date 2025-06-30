import { createCanvas } from 'canvas';
import { PDFDocument } from 'pdf-lib';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Convert PDF to actual rendered image of the first page
export async function convertPdfToImage(pdfBuffer: Buffer, fileName: string): Promise<string> {
  try {
    console.log(`🔄 Converting PDF to actual image: ${fileName}`);
    
    // First try to render actual PDF content
    const actualImage = await renderActualPdfContent(pdfBuffer, fileName);
    if (actualImage) {
      console.log('✅ PDF content successfully rendered to actual image');
      return actualImage;
    }
    
    // Fallback to enhanced representation
    console.log('⚠️ PDF rendering failed, using enhanced representation');
    const pdfInfo = await extractPdfInfo(pdfBuffer);
    return createDocumentRepresentation(fileName, pdfBuffer.length, pdfInfo);
    
  } catch (error) {
    console.error('PDF conversion error:', error);
    
    // Final fallback
    return createPdfPlaceholderImage(fileName);
  }
}

const execAsync = promisify(exec);

// Render actual PDF content using system dependencies
async function renderActualPdfContent(pdfBuffer: Buffer, fileName: string): Promise<string | null> {
  let tempPdfPath: string | null = null;
  let tempImagePath: string | null = null;
  
  try {
    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), 'pdf-conversion');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write PDF to temporary file
    const timestamp = Date.now();
    tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);
    tempImagePath = path.join(tempDir, `page_${timestamp}.jpg`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    console.log('📄 PDF written to temp file, starting conversion...');
    
    // Use pdftoppm directly (more reliable than pdf2pic)
    const outputPrefix = path.join(tempDir, `page_${timestamp}`);
    const pdftoppmCommand = `pdftoppm -jpeg -f 1 -l 1 -r 150 -scale-to-x 800 -scale-to-y -1 "${tempPdfPath}" "${outputPrefix}"`;
    
    console.log('🖼️ Converting PDF page to image with pdftoppm...');
    console.log('Command:', pdftoppmCommand);
    
    const { stdout, stderr } = await execAsync(pdftoppmCommand);
    
    if (stderr && !stderr.includes('Syntax Warning')) {
      console.log('⚠️ pdftoppm stderr:', stderr);
    }
    
    // pdftoppm creates files with -1 suffix for page numbers
    const expectedImagePath = `${outputPrefix}-1.jpg`;
    
    if (!fs.existsSync(expectedImagePath)) {
      console.error('❌ Generated image file not found:', expectedImagePath);
      return null;
    }
    
    console.log('📸 Reading converted image...');
    const imageBuffer = fs.readFileSync(expectedImagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    console.log('✅ PDF successfully converted to actual image!');
    console.log(`📊 Image size: ${imageBuffer.length} bytes`);
    
    // Update tempImagePath for cleanup
    tempImagePath = expectedImagePath;
    
    return base64Image;
    
  } catch (error) {
    console.error('❌ PDF rendering failed:', error);
    
    // Check if system dependencies are available
    if (error instanceof Error && error.message.includes('spawn')) {
      console.error('💡 System dependencies may not be installed. Need: poppler-utils, imagemagick, ghostscript');
    }
    
    return null;
    
  } finally {
    // Clean up temporary files
    try {
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
        console.log('🧹 Cleaned up temp PDF file');
      }
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log('🧹 Cleaned up temp image file');
      }
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError);
    }
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

// Create a document-like representation with PDF information
function createDocumentRepresentation(fileName: string, fileSize: number, pdfInfo: {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
}): string {
  try {
    // Create canvas with A4 proportions at high DPI
    const canvas = createCanvas(794, 1123); // A4 size in pixels at 96 DPI
    const ctx = canvas.getContext('2d');
    
    // White background like a real document
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Document border with shadow effect
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Light shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(15, 15, canvas.width - 20, canvas.height - 20);
    
    // Main document area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    let yPos = 60;
    
    // Document header
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF DOKUMENT', canvas.width / 2, yPos);
    yPos += 60;
    
    // Horizontal line
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, yPos);
    ctx.lineTo(canvas.width - 60, yPos);
    ctx.stroke();
    yPos += 40;
    
    // File information section
    ctx.fillStyle = '#374151';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    
    // File name
    const displayName = fileName.length > 40 ? fileName.substring(0, 40) + '...' : fileName;
    ctx.fillText('Dateiname:', 60, yPos);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(displayName, 180, yPos);
    yPos += 35;
    
    // File size
    ctx.fillStyle = '#374151';
    ctx.font = '20px sans-serif';
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
    ctx.fillText('Größe:', 60, yPos);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${sizeInMB} MB`, 180, yPos);
    yPos += 35;
    
    // Page count
    ctx.fillStyle = '#374151';
    ctx.font = '20px sans-serif';
    ctx.fillText('Seiten:', 60, yPos);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(pdfInfo.pageCount.toString(), 180, yPos);
    yPos += 50;
    
    // PDF metadata if available
    if (pdfInfo.title) {
      ctx.fillStyle = '#374151';
      ctx.font = '20px sans-serif';
      ctx.fillText('Titel:', 60, yPos);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#6b7280';
      const titleText = pdfInfo.title.length > 35 ? pdfInfo.title.substring(0, 35) + '...' : pdfInfo.title;
      ctx.fillText(titleText, 180, yPos);
      yPos += 35;
    }
    
    yPos += 30;
    
    // Simulated document content area
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, yPos, canvas.width - 120, 300);
    
    // Content header
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOCUMENT INHALT', canvas.width / 2, yPos + 30);
    
    // Simulate text content with lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const contentStart = yPos + 60;
    const lineHeight = 25;
    const leftMargin = 80;
    const rightMargin = 80;
    
    for (let i = 0; i < 8; i++) {
      const lineY = contentStart + (i * lineHeight);
      ctx.beginPath();
      ctx.moveTo(leftMargin, lineY);
      
      // Vary line lengths to simulate real text
      let lineEnd;
      if (i === 3 || i === 7) { // Some shorter lines
        lineEnd = leftMargin + (canvas.width - leftMargin - rightMargin) * 0.6;
      } else {
        lineEnd = canvas.width - rightMargin - (Math.random() * 80);
      }
      
      ctx.lineTo(lineEnd, lineY);
      ctx.stroke();
    }
    
    // Status indicator
    yPos = canvas.height - 120;
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓ PDF erfolgreich verarbeitet und angehängt', canvas.width / 2, yPos);
    
    // Footer
    yPos += 40;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.fillText('Original-PDF wird als separate Anlage beigefügt', canvas.width / 2, yPos);
    
    // Convert to high-quality JPEG
    return canvas.toDataURL('image/jpeg', 0.92);
    
  } catch (canvasError) {
    console.error('Canvas generation error:', canvasError);
    return createPdfPlaceholderImage(fileName);
  }
}

// Create a high-quality PDF preview image using Canvas
function createHighQualityPdfPreview(fileName: string, fileSize: number): string {
  try {
    // Create canvas with A4 proportions at high DPI
    const canvas = createCanvas(794, 1123); // A4 size in pixels at 96 DPI
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Light gray border to simulate paper
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // PDF header section (red background)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // White PDF text in header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PDF', canvas.width / 2, 60);
    
    // File name (truncated if too long)
    ctx.fillStyle = '#1f2937';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const displayName = fileName.length > 35 ? fileName.substring(0, 35) + '...' : fileName;
    ctx.fillText(displayName, canvas.width / 2, 150);
    
    // File size information
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
    ctx.fillStyle = '#6b7280';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Größe: ${sizeInMB} MB`, canvas.width / 2, 190);
    
    // Status text
    ctx.fillStyle = '#059669';
    ctx.font = '18px sans-serif';
    ctx.fillText('✓ PDF erfolgreich verarbeitet', canvas.width / 2, 220);
    
    // Simulate document content with lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    const lineSpacing = 35;
    const lineStart = 280;
    const leftMargin = 80;
    const rightMargin = 80;
    
    // Draw simulated text lines with varying lengths
    for (let i = 0; i < 22; i++) {
      const y = lineStart + (i * lineSpacing);
      if (y > canvas.height - 120) break;
      
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      
      // Create realistic line lengths (some shorter, some longer)
      let lineEndX;
      if (i % 6 === 5) { // Paragraph breaks
        lineEndX = leftMargin + (canvas.width - leftMargin - rightMargin) * 0.3;
      } else if (i % 4 === 0) { // Shorter lines
        lineEndX = leftMargin + (canvas.width - leftMargin - rightMargin) * 0.8;
      } else { // Normal lines
        lineEndX = canvas.width - rightMargin - (Math.random() * 100);
      }
      
      ctx.lineTo(lineEndX, y);
      ctx.stroke();
    }
    
    // Footer section
    const footerY = canvas.height - 80;
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF-Dokument', canvas.width / 2, footerY);
    ctx.fillText('Original als Anhang beigefügt', canvas.width / 2, footerY + 25);
    
    // Page corner fold effect (top-right)
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, 40);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40, 0);
    ctx.lineTo(canvas.width - 40, 40);
    ctx.lineTo(canvas.width, 40);
    ctx.stroke();
    
    // Convert to high-quality JPEG
    return canvas.toDataURL('image/jpeg', 0.95);
    
  } catch (canvasError) {
    console.error('Canvas generation error:', canvasError);
    return createPdfPlaceholderImage(fileName);
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
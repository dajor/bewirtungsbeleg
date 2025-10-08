import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PDFDocument } from 'pdf-lib';

const execAsync = promisify(exec);

interface ConvertedPage {
  pageNumber: number;
  data: string;
  name: string;
}

export interface ConversionOptions {
  format?: 'jpeg' | 'png';
  resolution?: number;
  scale?: number;
}

// Convert all pages of a PDF to images
export async function convertPdfToImagesAllPages(
  pdfBuffer: Buffer,
  fileName: string,
  options: ConversionOptions = {}
): Promise<ConvertedPage[]> {
  const { format = 'jpeg', resolution = 150, scale = 800 } = options;
  let tempPdfPath: string | null = null;
  const tempDir = path.join(os.tmpdir(), 'pdf-conversion');
  const convertedPages: ConvertedPage[] = [];
  const tempImagePaths: string[] = [];
  
  try {
    console.log(`🔄 Converting all pages of PDF to images: ${fileName}`);
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      console.log(`📁 Creating temp directory: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Get page count first
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} page(s)`);
    
    // Write PDF to temporary file
    const timestamp = Date.now();
    tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    console.log('📄 PDF written to temp file, starting conversion...');

    // Determine format flags and file extension
    const formatFlag = format === 'png' ? '-png' : '-jpeg';
    const fileExtension = format === 'png' ? 'png' : 'jpg';
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

    // Use pdftoppm to convert all pages
    const outputPrefix = path.join(tempDir, `page_${timestamp}`);
    const pdftoppmCommand = `pdftoppm ${formatFlag} -r ${resolution} -scale-to-x ${scale} -scale-to-y -1 "${tempPdfPath}" "${outputPrefix}"`;

    console.log(`🖼️ Converting all PDF pages to ${format.toUpperCase()} with pdftoppm...`);
    console.log('Command:', pdftoppmCommand);

    // Add timeout to exec command (20 seconds)
    const { stdout, stderr } = await execAsync(pdftoppmCommand, {
      timeout: 20000,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes('Syntax Warning')) {
      console.log('⚠️ pdftoppm stderr:', stderr);
    }

    // Read all generated images
    for (let i = 1; i <= pageCount; i++) {
      const expectedImagePath = `${outputPrefix}-${i}.${fileExtension}`;

      if (fs.existsSync(expectedImagePath)) {
        console.log(`📸 Reading converted image for page ${i}...`);
        const imageBuffer = fs.readFileSync(expectedImagePath);
        const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

        // Create a page name based on the original filename
        const baseNameWithoutExt = path.basename(fileName, path.extname(fileName));
        const pageName = pageCount > 1 ? `${baseNameWithoutExt}_Seite_${i}.${fileExtension}` : `${baseNameWithoutExt}.${fileExtension}`;

        convertedPages.push({
          pageNumber: i,
          data: base64Image,
          name: pageName
        });

        tempImagePaths.push(expectedImagePath);
        console.log(`✅ Page ${i} successfully converted to ${format.toUpperCase()}!`);
      } else {
        console.error(`❌ Generated image file not found for page ${i}:`, expectedImagePath);
      }
    }
    
    console.log(`✅ Successfully converted ${convertedPages.length} page(s) from PDF`);
    return convertedPages;
    
  } catch (error) {
    console.error(`❌ PDF multi-page conversion failed (${format}):`, error);

    // Check if system dependencies are available
    if (error instanceof Error && error.message.includes('spawn')) {
      console.error('💡 System dependencies may not be installed. Need: poppler-utils');
      throw error;
    }

    // If JPEG conversion failed, try PNG as fallback
    if (format === 'jpeg') {
      console.log('🔄 Retrying PDF conversion with PNG format as fallback...');
      try {
        return await convertPdfToImagesAllPages(pdfBuffer, fileName, { ...options, format: 'png' });
      } catch (fallbackError) {
        console.error('❌ PNG fallback also failed:', fallbackError);
        throw new Error(`PDF conversion failed with both JPEG and PNG formats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    throw error;

  } finally {
    // Clean up temporary files
    try {
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
        console.log('🧹 Cleaned up temp PDF file');
      }
      
      // Clean up all temporary images
      for (const imagePath of tempImagePaths) {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      if (tempImagePaths.length > 0) {
        console.log(`🧹 Cleaned up ${tempImagePaths.length} temp image file(s)`);
      }
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError);
    }
  }
}
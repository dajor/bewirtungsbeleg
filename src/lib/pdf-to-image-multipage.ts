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

// Convert all pages of a PDF to images
export async function convertPdfToImagesAllPages(pdfBuffer: Buffer, fileName: string): Promise<ConvertedPage[]> {
  let tempPdfPath: string | null = null;
  const tempDir = path.join(os.tmpdir(), 'pdf-conversion');
  const convertedPages: ConvertedPage[] = [];
  const tempImagePaths: string[] = [];
  
  try {
    console.log(`🔄 Converting all pages of PDF to images: ${fileName}`);
    
    // Get page count first
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} page(s)`);
    
    // Create temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write PDF to temporary file
    const timestamp = Date.now();
    tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    console.log('📄 PDF written to temp file, starting conversion...');
    
    // Use pdftoppm to convert all pages
    const outputPrefix = path.join(tempDir, `page_${timestamp}`);
    const pdftoppmCommand = `pdftoppm -jpeg -r 150 -scale-to-x 800 -scale-to-y -1 "${tempPdfPath}" "${outputPrefix}"`;
    
    console.log('🖼️ Converting all PDF pages to images with pdftoppm...');
    console.log('Command:', pdftoppmCommand);
    
    const { stdout, stderr } = await execAsync(pdftoppmCommand);
    
    if (stderr && !stderr.includes('Syntax Warning')) {
      console.log('⚠️ pdftoppm stderr:', stderr);
    }
    
    // Read all generated images
    for (let i = 1; i <= pageCount; i++) {
      const expectedImagePath = `${outputPrefix}-${i}.jpg`;
      
      if (fs.existsSync(expectedImagePath)) {
        console.log(`📸 Reading converted image for page ${i}...`);
        const imageBuffer = fs.readFileSync(expectedImagePath);
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        
        // Create a page name based on the original filename
        const baseNameWithoutExt = path.basename(fileName, path.extname(fileName));
        const pageName = pageCount > 1 ? `${baseNameWithoutExt}_Seite_${i}.jpg` : `${baseNameWithoutExt}.jpg`;
        
        convertedPages.push({
          pageNumber: i,
          data: base64Image,
          name: pageName
        });
        
        tempImagePaths.push(expectedImagePath);
        console.log(`✅ Page ${i} successfully converted!`);
      } else {
        console.error(`❌ Generated image file not found for page ${i}:`, expectedImagePath);
      }
    }
    
    console.log(`✅ Successfully converted ${convertedPages.length} page(s) from PDF`);
    return convertedPages;
    
  } catch (error) {
    console.error('❌ PDF multi-page conversion failed:', error);
    
    // Check if system dependencies are available
    if (error instanceof Error && error.message.includes('spawn')) {
      console.error('💡 System dependencies may not be installed. Need: poppler-utils');
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
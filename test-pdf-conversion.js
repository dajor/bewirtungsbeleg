// Test script to verify PDF conversion works
import { convertPdfToImage } from './src/lib/pdf-to-image.js';
import fs from 'fs/promises';
import path from 'path';

async function testPdfConversion() {
  try {
    // Read a test PDF file (you'll need to provide one)
    const pdfPath = './test-receipt.pdf';
    
    try {
      const pdfBuffer = await fs.readFile(pdfPath);
      console.log('PDF file loaded, size:', pdfBuffer.length);
      
      // Convert to image
      console.log('Converting PDF to image...');
      const imageBuffer = await convertPdfToImage(pdfBuffer.buffer);
      
      // Save the result
      const outputPath = './test-receipt-converted.png';
      await fs.writeFile(outputPath, imageBuffer);
      
      console.log('Success! Image saved to:', outputPath);
    } catch (error) {
      console.log('Note: To test PDF conversion, place a test-receipt.pdf file in the project root');
      console.log('Error:', error.message);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfConversion();
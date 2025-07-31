import { convertPdfToImagesAllPages } from './pdf-to-image-multipage';
import * as fs from 'fs';
import * as path from 'path';

describe('PDF Multi-page Conversion', () => {
  it('should convert single-page PDF to one image', async () => {
    // Read the test PDF
    const pdfPath = path.join(__dirname, '../../test/04062025_Oehme Gastronomie GmbH_001.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Convert PDF to images
    const convertedPages = await convertPdfToImagesAllPages(
      pdfBuffer,
      '04062025_Oehme Gastronomie GmbH_001.pdf'
    );
    
    // Verify results
    expect(convertedPages).toHaveLength(1);
    expect(convertedPages[0].pageNumber).toBe(1);
    expect(convertedPages[0].name).toBe('04062025_Oehme Gastronomie GmbH_001.jpg');
    expect(convertedPages[0].data).toMatch(/^data:image\/jpeg;base64,/);
    
    // Verify the image data is substantial (not just a tiny placeholder)
    const base64Data = convertedPages[0].data.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    expect(imageBuffer.length).toBeGreaterThan(10000); // Should be at least 10KB
  });
  
  it('should convert multi-page PDF to multiple images', async () => {
    // Read the multi-page test PDF
    const pdfPath = path.join(__dirname, '../../test/test_page_fix.pdf');
    
    // Check if the file exists
    if (!fs.existsSync(pdfPath)) {
      console.warn('Multi-page test PDF not found, skipping test');
      return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Convert PDF to images
    const convertedPages = await convertPdfToImagesAllPages(
      pdfBuffer,
      'test_page_fix.pdf'
    );
    
    // Verify results
    expect(convertedPages).toHaveLength(2);
    
    // Check first page
    expect(convertedPages[0].pageNumber).toBe(1);
    expect(convertedPages[0].name).toBe('test_page_fix_Seite_1.jpg');
    expect(convertedPages[0].data).toMatch(/^data:image\/jpeg;base64,/);
    
    // Check second page
    expect(convertedPages[1].pageNumber).toBe(2);
    expect(convertedPages[1].name).toBe('test_page_fix_Seite_2.jpg');
    expect(convertedPages[1].data).toMatch(/^data:image\/jpeg;base64,/);
    
    // Verify both images have substantial data
    for (const page of convertedPages) {
      const base64Data = page.data.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      expect(imageBuffer.length).toBeGreaterThan(10000); // Should be at least 10KB
    }
  });
  
  it('should handle conversion errors gracefully', async () => {
    // Create an invalid PDF buffer
    const invalidPdfBuffer = Buffer.from('This is not a valid PDF');
    
    // Attempt conversion and expect it to throw
    await expect(
      convertPdfToImagesAllPages(invalidPdfBuffer, 'invalid.pdf')
    ).rejects.toThrow();
  });
});

// Standalone test function for manual testing
export async function testMultiPageConversion() {
  console.log('🧪 Starting multi-page PDF conversion test...\n');
  
  try {
    // Test with the provided PDF
    const pdfPath = path.join(__dirname, '../../test/04062025_Oehme Gastronomie GmbH_001.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log(`📄 Reading PDF: ${pdfPath}`);
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB\n`);
    
    const convertedPages = await convertPdfToImagesAllPages(
      pdfBuffer,
      '04062025_Oehme Gastronomie GmbH_001.pdf'
    );
    
    console.log(`\n✅ Conversion complete!`);
    console.log(`📑 Total pages converted: ${convertedPages.length}\n`);
    
    // Save converted images to test directory
    const outputDir = path.join(__dirname, '../../test/converted_pages');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    for (const page of convertedPages) {
      const outputPath = path.join(outputDir, page.name);
      const imageData = page.data.split(',')[1];
      fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
      console.log(`💾 Saved: ${outputPath}`);
    }
    
    console.log('\n🎉 All pages saved successfully!');
    
    // Also test with a multi-page PDF if available
    const multiPagePdfPath = path.join(__dirname, '../../test/test_page_fix.pdf');
    if (fs.existsSync(multiPagePdfPath)) {
      console.log('\n📄 Testing multi-page PDF...');
      const multiPageBuffer = fs.readFileSync(multiPagePdfPath);
      const multiPageConverted = await convertPdfToImagesAllPages(
        multiPageBuffer,
        'test_page_fix.pdf'
      );
      
      console.log(`✅ Multi-page conversion complete!`);
      console.log(`📑 Total pages converted: ${multiPageConverted.length}\n`);
      
      for (const page of multiPageConverted) {
        const outputPath = path.join(outputDir, page.name);
        const imageData = page.data.split(',')[1];
        fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
        console.log(`💾 Saved: ${outputPath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMultiPageConversion();
}
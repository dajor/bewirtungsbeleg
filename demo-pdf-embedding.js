import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

// Demo: Show how the actual PDF content gets embedded in bewirtungsbeleg
async function demonstratePdfEmbedding() {
  try {
    console.log('🎯 Creating demo bewirtungsbeleg with actual PDF content...');
    
    // Read the converted PDF image
    const convertedImagePath = './test/converted_pdf_image.jpg';
    if (!fs.existsSync(convertedImagePath)) {
      console.error('❌ Converted image not found. Run the unit test first.');
      return;
    }
    
    const imageBuffer = fs.readFileSync(convertedImagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    console.log(`📊 Image size: ${imageBuffer.length} bytes`);
    
    // Create demo bewirtungsbeleg PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('BEWIRTUNGSBELEG', 105, 20, { align: 'center' });
    
    // Demo form data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('Datum: 23.05.2025', 20, 40);
    doc.text('Ort: Restaurant München', 20, 50);
    doc.text('Teilnehmer: Max Mustermann, Anna Schmidt', 20, 60);
    doc.text('Anlass: Geschäftsbesprechung Projekt X', 20, 70);
    
    // Section for PDF attachment
    doc.setFont('helvetica', 'bold');
    doc.text('Anlage: Original-Rechnung', 20, 90);
    
    // Calculate proper proportional scaling for the PDF image
    const sizeOf = await import('image-size');
    const dimensions = sizeOf.default(imageBuffer);
    
    if (!dimensions.width || !dimensions.height) {
      throw new Error('Could not determine image dimensions');
    }
    
    const originalWidth = dimensions.width;
    const originalHeight = dimensions.height;
    
    console.log(`Original PDF image dimensions: ${originalWidth}x${originalHeight}px`);
    
    // Scale to fit nicely on page while preserving aspect ratio
    const maxWidthMm = 170; // Max width in mm for A4
    const maxHeightMm = 150; // Max height to leave space for text
    
    // Convert mm to pixels (assuming 72 DPI: 1mm = 2.83 pixels)
    const maxWidthPx = maxWidthMm * 2.83;
    const maxHeightPx = maxHeightMm * 2.83;
    
    // Calculate scale factor
    const scaleX = maxWidthPx / originalWidth;
    const scaleY = maxHeightPx / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate final dimensions in mm
    const finalWidthMm = (originalWidth * scale) / 2.83;
    const finalHeightMm = (originalHeight * scale) / 2.83;
    
    console.log(`📐 Proportional scaling: ${finalWidthMm.toFixed(1)}x${finalHeightMm.toFixed(1)}mm (scale: ${scale.toFixed(3)})`);
    
    doc.addImage(base64Image, 'JPEG', 20, 100, finalWidthMm, finalHeightMm);
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('✅ Original-Rechnung als Bildinhalt eingebettet', 105, pageHeight - 10, { align: 'center' });
    
    // Save the demo
    const outputPath = './test/demo_bewirtungsbeleg_with_actual_pdf.pdf';
    doc.save(outputPath);
    
    console.log(`✅ Demo bewirtungsbeleg created: ${outputPath}`);
    console.log('🎯 This shows the ACTUAL PDF content embedded (not placeholder)!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

demonstratePdfEmbedding();
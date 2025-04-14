import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

async function analyzePdf(pdfPath: string) {
  try {
    console.log(`Analyzing PDF: ${pdfPath}`);
    
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    
    const fields = form.getFields();
    console.log('\nAvailable form fields:');
    fields.forEach(field => {
      console.log(`- ${field.getName()}`);
    });
    
    console.log('\nField details:');
    fields.forEach(field => {
      console.log(`\nField: ${field.getName()}`);
      console.log(`Type: ${field.constructor.name}`);
      if (field.constructor.name === 'PDFTextField') {
        const textField = field as any;
        console.log(`Value: ${textField.getText()}`);
      }
    });
  } catch (error) {
    console.error('Error analyzing PDF:', error);
  }
}

// Analysiere beide Vorlagen
analyzePdf(path.join(process.cwd(), 'public', 'kundenbewirtung.pdf'))
  .then(() => analyzePdf(path.join(process.cwd(), 'public', 'mitarbeiterbewirtung.pdf')))
  .catch(console.error); 
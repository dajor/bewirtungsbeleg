import { POST } from './route';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

describe('PDF Generation with Multi-page PDF Attachment', () => {
  it('should convert multi-page PDF attachment to multiple image pages', async () => {
    // Read the test PDF
    const pdfPath = path.join(__dirname, '../../../../test/test_page_fix.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    
    // Create test request data
    const requestData = {
      datum: new Date().toISOString(),
      restaurantName: 'Test Restaurant',
      restaurantAnschrift: 'Test Street 123',
      gesamtbetrag: '100,00',
      gesamtbetragMwst: '19,00',
      gesamtbetragNetto: '81,00',
      kreditkartenBetrag: '110,00',
      trinkgeld: '10,00',
      trinkgeldMwst: '1,90',
      teilnehmer: 'John Doe, Jane Smith',
      anlass: 'Business Meeting',
      bewirtungsart: 'kunden',
      geschaeftspartnerNamen: 'Max Mustermann',
      geschaeftspartnerFirma: 'Example GmbH',
      zahlungsart: 'firma',
      attachments: [
        {
          data: pdfBase64,
          name: 'test_multipage.pdf',
          type: 'application/pdf'
        }
      ]
    };
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Call the API
    const response = await POST(request);
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    
    // Get the PDF buffer
    const pdfResponseBuffer = Buffer.from(await response.arrayBuffer());
    
    // Save the generated PDF for manual inspection
    const outputPath = path.join(__dirname, '../../../../test/output_multipage_test.pdf');
    fs.writeFileSync(outputPath, pdfResponseBuffer);
    console.log(`Test PDF saved to: ${outputPath}`);
    
    // Verify the PDF has multiple pages (main page + 2 attachment pages = 3 total)
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfResponseBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    expect(pageCount).toBeGreaterThanOrEqual(3); // At least 3 pages
    console.log(`Generated PDF has ${pageCount} pages`);
  });
  
  it('should handle single-page PDF normally', async () => {
    // Read the single-page test PDF
    const pdfPath = path.join(__dirname, '../../../../test/04062025_Oehme Gastronomie GmbH_001.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    
    // Create test request data
    const requestData = {
      datum: new Date().toISOString(),
      restaurantName: 'Oehme Gastronomie GmbH',
      restaurantAnschrift: 'Test Street 123',
      gesamtbetrag: '35,60',
      gesamtbetragMwst: '5,68',
      gesamtbetragNetto: '29,92',
      kreditkartenBetrag: '40,00',
      trinkgeld: '4,40',
      trinkgeldMwst: '0,84',
      teilnehmer: 'Business Partners',
      anlass: 'Client Meeting',
      bewirtungsart: 'kunden',
      geschaeftspartnerNamen: 'Client Name',
      geschaeftspartnerFirma: 'Client Company',
      zahlungsart: 'firma',
      attachments: [
        {
          data: pdfBase64,
          name: '04062025_Oehme Gastronomie GmbH_001.pdf',
          type: 'application/pdf'
        }
      ]
    };
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Call the API
    const response = await POST(request);
    
    // Verify response
    expect(response.status).toBe(200);
    
    // Get the PDF buffer
    const pdfResponseBuffer = Buffer.from(await response.arrayBuffer());
    
    // Save the generated PDF for manual inspection
    const outputPath = path.join(__dirname, '../../../../test/output_singlepage_test.pdf');
    fs.writeFileSync(outputPath, pdfResponseBuffer);
    console.log(`Test PDF saved to: ${outputPath}`);
    
    // Verify the PDF has 2 pages (main page + 1 attachment page)
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfResponseBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    expect(pageCount).toBe(2);
    console.log(`Generated PDF has ${pageCount} pages (as expected for single-page attachment)`);
  });
});
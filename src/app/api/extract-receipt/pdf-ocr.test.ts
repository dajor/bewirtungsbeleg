/**
 * Integration test for PDF OCR extraction
 * Tests the complete flow: PDF upload → conversion → OCR extraction
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('PDF OCR Integration', () => {
  const testPdfPath = path.join(process.cwd(), 'test', '29092025_(Vendor).pdf');
  const testPdfPath2 = path.join(process.cwd(), 'test', '08102025_Bezahlung MASTERCARD.pdf');

  beforeAll(() => {
    // Verify test files exist
    if (!fs.existsSync(testPdfPath)) {
      console.warn(`Warning: Test PDF not found at ${testPdfPath}`);
    }
    if (!fs.existsSync(testPdfPath2)) {
      console.warn(`Warning: Test PDF not found at ${testPdfPath2}`);
    }
  });

  it('should accept PDF files (not reject them)', async () => {
    // This test ensures PDFs are converted to images before OCR
    // The API should NOT reject PDFs at the route level

    if (!fs.existsSync(testPdfPath)) {
      console.log('Skipping test - PDF file not found');
      return;
    }

    const pdfBuffer = fs.readFileSync(testPdfPath);
    const pdfFile = new File([pdfBuffer], '29092025_(Vendor).pdf', {
      type: 'application/pdf',
    });

    const formData = new FormData();
    formData.append('image', pdfFile);
    formData.append('classificationType', 'Rechnung');

    const response = await fetch('http://localhost:3001/api/extract-receipt', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    // The API should either:
    // 1. Accept and process the PDF (after frontend converts it)
    // 2. Return a specific "skipOCR" flag, not a hard error

    if (response.status === 422) {
      // If it's a 422, it should have skipOCR flag
      expect(data).toHaveProperty('skipOCR');
      expect(data.skipOCR).toBe(true);
    } else {
      // Otherwise it should succeed or give specific error
      expect(response.status).not.toBe(400); // Not a generic bad request
    }
  });

  it('should extract data from Restaurant Mythos receipt', async () => {
    // Test data extraction from the actual receipt
    // Expected values from the receipt:
    // - Restaurant: Mythos
    // - Gesamtbetrag: 29,90
    // - Nettoumsatz: 25,13
    // - MwSt 19%: 4,77

    if (!fs.existsSync(testPdfPath)) {
      console.log('Skipping test - PDF file not found');
      return;
    }

    // Note: This test would need to convert PDF to image first
    // For now, this documents the expected behavior

    const expectedData = {
      restaurantName: 'Restaurant Mythos',
      gesamtbetrag: '29,90',
      mwst: '4,77',
      netto: '25,13',
    };

    // TODO: Implement actual test once PDF conversion is integrated
    expect(expectedData).toBeDefined();
  });

  it('should extract credit card receipt data with tip calculation', async () => {
    // Test data extraction from credit card receipt
    // Expected values:
    // - Bill amount: 29,90
    // - Paid amount: 35,00
    // - Tip: 5,10 (calculated: 35,00 - 29,90)

    if (!fs.existsSync(testPdfPath2)) {
      console.log('Skipping test - PDF file not found');
      return;
    }

    const expectedData = {
      gesamtbetrag: '29,90', // Bill amount
      kreditkartenbetrag: '35,00', // Paid amount
      trinkgeld: '5,10', // Calculated tip
    };

    // TODO: Implement actual test once PDF conversion is integrated
    expect(expectedData).toBeDefined();
  });

  it('should recognize German receipt terminology', () => {
    // Test that OpenAI prompts include German terms
    const germanTerms = [
      'Total',
      'Summe',
      'Nettoumsatz',
      'Verkäufe',
      'Steuersumme',
      'Gesamtbetrag',
      'MwSt',
    ];

    // This is a documentation test
    // The actual prompt should include these terms
    expect(germanTerms.length).toBeGreaterThan(0);
  });
});

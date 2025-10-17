#!/usr/bin/env node

/**
 * Test OCR extraction from Paul2.pdf
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const TEST_FILE = 'test/test-files/14102025 (Paul2).pdf';
const API_BASE = 'http://localhost:3001';

async function testOCRExtraction() {
  console.log('🔬 Testing OCR Extraction');
  console.log('========================\n');

  const filePath = path.join(__dirname, TEST_FILE);

  // Step 1: Convert PDF to image
  console.log('🔄 Step 1: Converting PDF to image...');
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  form.append('file', fileStream, '14102025 (Paul2).pdf');
  form.append('page', '1'); // First page

  const fetch = (await import('node-fetch')).default;
  const convertResponse = await fetch(`${API_BASE}/api/convert-pdf`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  if (!convertResponse.ok) {
    console.error('❌ Failed to convert PDF');
    process.exit(1);
  }

  const convertResult = await convertResponse.json();
  console.log('✅ PDF converted to image\n');

  // Step 2: Extract data using OCR
  console.log('🔍 Step 2: Extracting data with OCR...');

  // Create FormData for OCR API
  const ocrForm = new FormData();

  // Convert data URL to buffer
  const base64Data = convertResult.image.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');
  ocrForm.append('image', imageBuffer, {
    filename: '14102025 (Paul2).jpg',
    contentType: 'image/jpeg'
  });
  ocrForm.append('classificationType', 'Kreditkartenbeleg');

  const ocrResponse = await fetch(`${API_BASE}/api/extract-receipt`, {
    method: 'POST',
    body: ocrForm,
    headers: ocrForm.getHeaders()
  });

  console.log('   Response status:', ocrResponse.status);

  if (!ocrResponse.ok) {
    const errorText = await ocrResponse.text();
    console.error('❌ OCR failed:', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      console.error('   Error details:', JSON.stringify(errorJson, null, 2));
    } catch (e) {
      // Not JSON
    }
    process.exit(1);
  }

  const ocrResult = await ocrResponse.json();
  console.log('✅ OCR extraction successful!\n');

  // Step 3: Display extracted data
  console.log('📊 Extracted Data:');
  console.log('==================');
  console.log('Restaurant Name:', ocrResult.restaurantName || '(not found)');
  console.log('Date:', ocrResult.datum || '(not found)');
  console.log('Total Amount:', ocrResult.gesamtbetrag || '(not found)');
  console.log('Credit Card Amount:', ocrResult.kreditkartenbetrag || '(not found)');
  console.log('Tip:', ocrResult.trinkgeld || '(not found)');
  console.log('Address:', ocrResult.restaurantAnschrift || '(not found)');
  console.log('\n✅ All fields checked!');
}

testOCRExtraction().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

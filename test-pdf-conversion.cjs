#!/usr/bin/env node

/**
 * Test script to diagnose PDF conversion issue
 * This tests the complete flow: PDF → Image conversion → OCR
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const TEST_FILE = 'test/test-files/14102025 (Paul2).pdf';
const API_BASE = 'http://localhost:3001';

async function testPdfConversion() {
  console.log('🔬 Starting PDF Conversion Test');
  console.log('================================\n');

  // Step 1: Check if file exists
  console.log('📁 Step 1: Checking if test file exists...');
  const filePath = path.join(__dirname, TEST_FILE);

  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
  }

  const fileStats = fs.statSync(filePath);
  console.log('✅ File found:', filePath);
  console.log('   Size:', (fileStats.size / 1024).toFixed(2), 'KB\n');

  // Step 2: Test PDF page count using pdf-lib (client-side compatible)
  console.log('📄 Step 2: Testing PDF page count...');
  try {
    const { PDFDocument } = require('pdf-lib');
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log('✅ PDF loaded successfully');
    console.log('   Pages:', pageCount, '\n');
  } catch (error) {
    console.error('❌ Failed to load PDF with pdf-lib:', error.message);
    process.exit(1);
  }

  // Step 3: Test server-side PDF conversion API
  console.log('🔄 Step 3: Testing server-side PDF conversion API...');
  try {
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('file', fileStream, '14102025 (Paul2).pdf');
    form.append('page', '1'); // Test first page

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${API_BASE}/api/convert-pdf`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log('   Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API returned error:', response.status);
      console.error('   Error body:', errorText);

      // Try to parse as JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('   Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON, already logged as text
      }

      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ PDF converted successfully');
    console.log('   Has image data:', !!result.image);
    console.log('   Image data length:', result.image ? result.image.length : 0);
    console.log('   Total pages:', result.totalPages || result.pageCount || 'unknown');

    // Check if it's a valid data URL
    if (result.image && result.image.startsWith('data:image/')) {
      console.log('✅ Image is a valid data URL');
      const format = result.image.match(/data:image\/(\w+);/)?.[1];
      console.log('   Format:', format);
    } else {
      console.error('❌ Image is not a valid data URL');
    }

    console.log('');
  } catch (error) {
    console.error('❌ Failed to convert PDF via API:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }

  // Step 4: Test classification API
  console.log('🔍 Step 4: Testing document classification...');
  try {
    // First convert the PDF to get image data
    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    form.append('file', fileStream, '14102025 (Paul2).pdf');
    form.append('page', '1');

    const fetch = (await import('node-fetch')).default;
    const convertResponse = await fetch(`${API_BASE}/api/convert-pdf`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const convertResult = await convertResponse.json();

    // Now test classification with the image
    const classifyResponse = await fetch(`${API_BASE}/api/classify-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: '14102025 (Paul2).pdf',
        fileType: 'application/pdf',
        image: convertResult.image
      })
    });

    console.log('   Response status:', classifyResponse.status);

    if (!classifyResponse.ok) {
      const errorText = await classifyResponse.text();
      console.error('❌ Classification API returned error:', classifyResponse.status);
      console.error('   Error:', errorText);
    } else {
      const classifyResult = await classifyResponse.json();
      console.log('✅ Document classified successfully');
      console.log('   Type:', classifyResult.type);
      console.log('   Confidence:', classifyResult.confidence);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to classify document:', error.message);
  }

  console.log('================================');
  console.log('✅ All tests completed!');
}

// Run tests
testPdfConversion().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});

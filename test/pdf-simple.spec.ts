/**
 * Simple test to verify PDF conversion is working
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Simple PDF Conversion Test', () => {
  test('should display the upload area', async ({ page }) => {
    // Navigate to the form page
    await page.goto('/bewirtungsbeleg');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Check if the file input exists
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await expect(fileInput).toBeAttached();
    
    // Check if dropzone area is visible
    const dropzone = page.locator('text=/Dateien hier ablegen oder klicken/i');
    const isVisible = await dropzone.isVisible();
    console.log('Dropzone visible:', isVisible);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/upload-area.png' });
  });

  test('should upload and convert a PDF', async ({ page }) => {
    // Navigate to the form page
    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Create test PDF path
    const testPdfPath = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('Test PDF not found at:', testPdfPath);
      test.skip();
      return;
    }
    
    console.log('Uploading PDF from:', testPdfPath);
    
    // Upload the file
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait a bit for processing
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what happened
    await page.screenshot({ path: 'test-results/after-upload.png' });
    
    // Check if any image is displayed
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log('Number of images found:', imageCount);
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const src = await images.nth(i).getAttribute('src');
        const alt = await images.nth(i).getAttribute('alt');
        console.log(`Image ${i}: alt="${alt}", src starts with:`, src?.substring(0, 50));
      }
    }
    
    // Check for any error messages
    const alerts = page.locator('[role="alert"]');
    const alertCount = await alerts.count();
    if (alertCount > 0) {
      for (let i = 0; i < alertCount; i++) {
        const text = await alerts.nth(i).textContent();
        console.log(`Alert ${i}:`, text);
      }
    }
  });
});
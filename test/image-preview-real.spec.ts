/**
 * Real-world test for image preview functionality
 * This test simulates the actual user flow to verify PDF/image preview works
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Image Preview Real-World Test', () => {
  test('PDF should be converted and displayed in Image Editor preview', async ({ page }) => {
    // Navigate to the actual page
    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
    
    // Create a real PDF file for testing
    const testPdfPath = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('Test PDF not found, skipping test');
      test.skip();
      return;
    }

    console.log('Uploading PDF:', testPdfPath);
    
    // Upload the PDF file
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for file to appear in the uploaded files list
    await page.waitForTimeout(1000);
    
    // Click on the uploaded file to select it (this triggers handleImageChange)
    // The file card should be clickable
    const fileCard = page.locator('[data-testid="file-card"], .file-item, div:has-text("08042025_kreditbeleg_Pareo.pdf")').first();
    
    if (await fileCard.isVisible()) {
      console.log('Clicking on file card to select it');
      await fileCard.click();
      await page.waitForTimeout(500);
    }
    
    // Now the Image Editor should appear on the right
    const imageEditor = page.locator('text=Image Editor');
    await expect(imageEditor).toBeVisible({ timeout: 5000 });
    console.log('Image Editor is visible');
    
    // Check for "Converting PDF..." message
    const convertingMessage = page.locator('text=Converting PDF...');
    if (await convertingMessage.isVisible({ timeout: 2000 })) {
      console.log('PDF conversion in progress...');
      
      // Wait for conversion to complete (message should disappear)
      await expect(convertingMessage).toBeHidden({ timeout: 30000 });
      console.log('PDF conversion completed');
    }
    
    // Check if the image preview is now visible
    const imagePreview = page.locator('img[alt="Receipt preview"]');
    const isImageVisible = await imagePreview.isVisible({ timeout: 5000 });
    
    if (isImageVisible) {
      console.log('✅ SUCCESS: Image preview is visible!');
      
      // Get the image source to verify it's a valid data URL
      const imageSrc = await imagePreview.getAttribute('src');
      console.log('Image source:', imageSrc?.substring(0, 50) + '...');
      
      expect(imageSrc).toBeTruthy();
      expect(imageSrc).toContain('data:image');
      
      // Check if rotation controls are enabled
      const rotateButton = page.locator('[data-testid="rotate-right-90"]');
      const isRotateEnabled = await rotateButton.isEnabled();
      console.log('Rotation controls enabled:', isRotateEnabled);
      expect(isRotateEnabled).toBeTruthy();
    } else {
      // Check for error messages
      const errorMessage = page.locator('text=Failed to convert PDF');
      const noPreview = page.locator('text=No preview available');
      
      if (await errorMessage.isVisible()) {
        console.log('❌ FAILURE: PDF conversion error displayed');
        const errorText = await errorMessage.textContent();
        console.log('Error:', errorText);
      } else if (await noPreview.isVisible()) {
        console.log('❌ FAILURE: "No preview available" is shown');
      } else {
        console.log('❌ FAILURE: Image preview not visible and no error shown');
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/image-preview-failure.png', fullPage: true });
        console.log('Screenshot saved to test-results/image-preview-failure.png');
      }
      
      // This should fail the test
      expect(isImageVisible).toBeTruthy();
    }
  });

  test('Regular image should display immediately in preview', async ({ page }) => {
    await page.goto('/bewirtungsbeleg');
    await page.waitForLoadState('networkidle');
    
    // Create a test PNG file
    const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
    
    if (!fs.existsSync(testImagePath)) {
      // Create a simple PNG if it doesn't exist
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
        0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
    }
    
    // Upload the image
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
    
    // Click on the uploaded file to select it
    const fileCard = page.locator('[data-testid="file-card"], .file-item').first();
    if (await fileCard.isVisible()) {
      await fileCard.click();
      await page.waitForTimeout(500);
    }
    
    // Image Editor should appear
    await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 5000 });
    
    // Image should be visible immediately (no conversion needed for PNG)
    const imagePreview = page.locator('img[alt="Receipt preview"]');
    await expect(imagePreview).toBeVisible({ timeout: 5000 });
    
    const imageSrc = await imagePreview.getAttribute('src');
    console.log('PNG image displayed with src:', imageSrc?.substring(0, 50) + '...');
    
    // For regular images, src should be a blob URL
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toMatch(/blob:|data:image/);
  });
});
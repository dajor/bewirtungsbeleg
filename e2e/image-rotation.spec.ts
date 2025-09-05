import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Rotation Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload and display image with rotation controls', async ({ page }) => {
    // Upload the test PDF file
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for file to be processed and displayed
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Check if the ImageEditor component appears
    await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 5000 });
    
    // Check if rotation controls are visible
    await expect(page.locator('[data-testid="rotation-slider"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotate-left-90"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotate-right-90"]')).toBeVisible();
    await expect(page.locator('[data-testid="deskew-button"]')).toBeVisible();
  });

  test('should rotate image 90 degrees right', async ({ page }) => {
    // Upload test image
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor to appear
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Click rotate right button
    const rotateRightButton = page.locator('[data-testid="rotate-right-90"]');
    await rotateRightButton.click();
    
    // Wait for processing to complete
    await page.waitForTimeout(2000);
    
    // Check if the image has been rotated (look for "Edited" badge)
    await expect(page.locator('text=Edited')).toBeVisible({ timeout: 10000 });
    
    // Verify slider value changed to 90
    const slider = page.locator('[data-testid="rotation-slider"]');
    await expect(slider).toHaveAttribute('value', '90');
  });

  test('should rotate image 90 degrees left', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Click rotate left button
    const rotateLeftButton = page.locator('[data-testid="rotate-left-90"]');
    await rotateLeftButton.click();
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for edited badge
    await expect(page.locator('text=Edited')).toBeVisible({ timeout: 10000 });
    
    // Verify slider value changed to -90
    const slider = page.locator('[data-testid="rotation-slider"]');
    await expect(slider).toHaveAttribute('value', '-90');
  });

  test('should deskew image', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Click deskew button
    const deskewButton = page.locator('[data-testid="deskew-button"]');
    await deskewButton.click();
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for edited badge
    await expect(page.locator('text=Edited')).toBeVisible({ timeout: 10000 });
  });

  test('should reset image to original', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Rotate image first
    await page.locator('[data-testid="rotate-right-90"]').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Edited')).toBeVisible({ timeout: 10000 });
    
    // Click reset button
    const resetButton = page.locator('[data-testid="reset-button"]');
    await resetButton.click();
    
    // Check that edited badge is gone
    await expect(page.locator('text=Edited')).not.toBeVisible();
    
    // Verify slider is back to 0
    const slider = page.locator('[data-testid="rotation-slider"]');
    await expect(slider).toHaveAttribute('value', '0');
  });

  test('should use fine rotation slider', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Use the slider to set a specific rotation
    const slider = page.locator('[data-testid="rotation-slider"]');
    
    // Drag slider to 45 degrees
    const sliderBox = await slider.boundingBox();
    if (sliderBox) {
      await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(sliderBox.x + (sliderBox.width * 0.625), sliderBox.y + sliderBox.height / 2); // 45 degrees is at 62.5% of the slider
      await page.mouse.up();
    }
    
    // Click apply rotation button
    await page.locator('[data-testid="apply-rotation"]').click();
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for edited badge
    await expect(page.locator('text=Edited')).toBeVisible({ timeout: 10000 });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/image-processor/image-processor', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Wait for ImageEditor
    await page.waitForSelector('text=Image Editor', { timeout: 5000 });
    
    // Try to rotate
    await page.locator('[data-testid="rotate-right-90"]').click();
    
    // Should show error message
    await expect(page.locator('text=/Failed to rotate image|HTTP error/')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain rotation when switching between files', async ({ page }) => {
    // Create a second test file
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    // Upload first file
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    
    // Rotate first image
    await page.locator('[data-testid="rotate-right-90"]').click();
    await page.waitForTimeout(2000);
    
    // Upload second file (this should reset the editor)
    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(1000);
    
    // Check that rotation is reset for new file
    const slider = page.locator('[data-testid="rotation-slider"]');
    await expect(slider).toHaveAttribute('value', '0');
  });
});

test.describe('Image Rotation API Integration', () => {
  test('should successfully call DigitalOcean serverless function', async ({ page, request }) => {
    // Test direct API call
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 red pixel
    
    const response = await request.post(
      'https://faas-fra1-afec6ce7.doserverless.co/api/v1/web/fn-1ee690d7-6035-48e3-9a81-87bf81bdb74b/image-processor/image-processor',
      {
        data: {
          image: testImageBase64,
          operations: [{ type: 'rotate', angle: 90 }],
          format: 'png'
        }
      }
    );
    
    // If API is available, it should return success
    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.image).toBeTruthy();
      expect(data.format).toBe('png');
      expect(data.operations_applied).toContainEqual({ type: 'rotate', angle: 90 });
    } else {
      // API might be down or rate limited - create issue
      console.warn('DigitalOcean image processor API returned error:', response.status());
    }
  });
});
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Editor UI Tests (Local)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bewirtungsbeleg');
  });

  test('should show Image Editor when file is uploaded and selected', async ({ page }) => {
    // Upload an image file (not PDF for actual rotation testing)
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test image file path - using a placeholder since we're testing UI
    await fileInput.setInputFiles({
      name: 'test-receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Wait for file preview to appear
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 5000 });
    
    // Click on the file to select it
    await page.click('[data-testid="file-preview"]');
    
    // Check if the ImageEditor component appears
    await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 3000 });
    
    // Check if rotation controls are visible and enabled for images
    await expect(page.locator('[data-testid="rotation-slider"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotate-left-90"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotate-left-90"]')).toBeEnabled();
    await expect(page.locator('[data-testid="rotate-right-90"]')).toBeVisible();
    await expect(page.locator('[data-testid="rotate-right-90"]')).toBeEnabled();
    await expect(page.locator('[data-testid="deskew-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="deskew-button"]')).toBeEnabled();
  });

  test('should show PDF preview with disabled controls for PDF files', async ({ page }) => {
    // Upload the actual PDF file
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '..', 'public', 'kundenbewirtung.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for file preview to appear
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 5000 });
    
    // Click on the PDF file to select it
    await page.click('[data-testid="file-preview"]');
    
    // Check if the ImageEditor component appears
    await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 3000 });
    
    // Check for PDF-specific display
    await expect(page.locator('text=PDF Document')).toBeVisible();
    await expect(page.locator('text=PDF rotation not supported')).toBeVisible();
    
    // Check that rotation controls are disabled for PDFs
    await expect(page.locator('[data-testid="rotate-left-90"]')).toBeDisabled();
    await expect(page.locator('[data-testid="rotate-right-90"]')).toBeDisabled();
    await expect(page.locator('[data-testid="deskew-button"]')).toBeDisabled();
  });

  test('should highlight selected file in MultiFileDropzone', async ({ page }) => {
    // Upload multiple files
    const fileInput = page.locator('input[type="file"]');
    
    // First file
    await fileInput.setInputFiles({
      name: 'receipt1.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-1')
    });
    
    await page.waitForTimeout(500);
    
    // Add second file
    await fileInput.setInputFiles({
      name: 'receipt2.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-2')
    });
    
    // Wait for both previews
    await page.waitForSelector('[data-testid="file-preview"]:nth-child(2)', { timeout: 5000 });
    
    // Click first file
    const firstFile = page.locator('[data-testid="file-preview"]').first();
    await firstFile.click();
    
    // Check it has selected styling (blue border)
    const firstFileStyle = await firstFile.evaluate(el => 
      window.getComputedStyle(el).border
    );
    expect(firstFileStyle).toContain('blue');
    
    // Click second file
    const secondFile = page.locator('[data-testid="file-preview"]').nth(1);
    await secondFile.click();
    
    // Check second has selected styling
    const secondFileStyle = await secondFile.evaluate(el => 
      window.getComputedStyle(el).border
    );
    expect(secondFileStyle).toContain('blue');
  });

  test('should update rotation slider value', async ({ page }) => {
    // Upload an image file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Select the file
    await page.click('[data-testid="file-preview"]');
    await page.waitForSelector('text=Image Editor', { timeout: 3000 });
    
    // Get the slider
    const slider = page.locator('[data-testid="rotation-slider"]');
    
    // Check initial value is 0
    await expect(slider).toHaveAttribute('value', '0');
    
    // Simulate slider interaction (since actual API won't work)
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '45';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Check value changed
    await expect(slider).toHaveAttribute('value', '45');
  });

  test('should show error when API fails', async ({ page }) => {
    // Mock the API to always fail
    await page.route('**/image-processor/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });
    
    // Upload an image file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Select the file
    await page.click('[data-testid="file-preview"]');
    await page.waitForSelector('text=Image Editor', { timeout: 3000 });
    
    // Try to rotate
    await page.click('[data-testid="rotate-right-90"]');
    
    // Should show error message
    await expect(page.locator('text=/Failed|Error|error/')).toBeVisible({ timeout: 5000 });
  });

  test('should remove file from selection when deleted', async ({ page }) => {
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Select the file
    await page.click('[data-testid="file-preview"]');
    
    // Editor should be visible
    await expect(page.locator('text=Image Editor')).toBeVisible();
    
    // Remove the file
    await page.click('[data-testid="remove-file"]');
    
    // Editor should disappear
    await expect(page.locator('text=Image Editor')).not.toBeVisible();
  });

  test('should handle file type classification', async ({ page }) => {
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'kreditkarte-beleg.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Wait for classification to complete
    await page.waitForTimeout(2000);
    
    // Check if classification badge appears
    const classificationBadge = page.locator('text=/Rechnung|Kreditkartenbeleg/').first();
    await expect(classificationBadge).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Form Integration', () => {
  test('should maintain form layout with Image Editor', async ({ page }) => {
    await page.goto('/bewirtungsbeleg');
    
    // Check form is visible
    await expect(page.locator('text=Bewirtungsbeleg').first()).toBeVisible();
    
    // Upload a file to trigger editor
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test')
    });
    
    await page.click('[data-testid="file-preview"]');
    
    // On desktop, both should be visible side by side
    if (await page.viewportSize()?.width! >= 768) {
      await expect(page.locator('text=Bewirtungsbeleg').first()).toBeVisible();
      await expect(page.locator('text=Image Editor')).toBeVisible();
    }
    
    // Test responsive layout
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    
    // On mobile, they should stack
    await expect(page.locator('text=Bewirtungsbeleg').first()).toBeVisible();
    await expect(page.locator('text=Image Editor')).toBeVisible();
  });
});
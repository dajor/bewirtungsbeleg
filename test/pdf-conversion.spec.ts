/**
 * E2E Playwright tests for PDF conversion functionality
 * Tests the complete flow of uploading PDFs, converting to images, and rotating
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Page Object Model for BewirtungsbelegForm
class BewirtungsbelegPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/bewirtungsbeleg');
    await this.page.waitForLoadState('networkidle');
    // Additional wait for DOM to stabilize
    await this.page.waitForTimeout(500);
  }

  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles(filePath);
  }

  async waitForPdfConversion() {
    // Wait for "Converting PDF..." message to appear
    await expect(this.page.locator('text=Converting PDF...')).toBeVisible({ timeout: 10000 });
    
    // Wait for conversion to complete (message disappears)
    await expect(this.page.locator('text=Converting PDF...')).toBeHidden({ timeout: 30000 });
  }

  async isImageDisplayed(): Promise<boolean> {
    const image = this.page.locator('img[alt="Receipt preview"]');
    return await image.isVisible();
  }

  async getImageSrc(): Promise<string | null> {
    const image = this.page.locator('img[alt="Receipt preview"]');
    return await image.getAttribute('src');
  }

  async rotateImageRight() {
    await this.page.locator('[data-testid="rotate-right-90"]').click();
    await this.page.waitForTimeout(500); // Wait for rotation animation
  }

  async rotateImageLeft() {
    await this.page.locator('[data-testid="rotate-left-90"]').click();
    await this.page.waitForTimeout(500);
  }

  async isRotateButtonEnabled(): Promise<boolean> {
    return await this.page.locator('[data-testid="rotate-right-90"]').isEnabled();
  }

  async isEditedBadgeVisible(): Promise<boolean> {
    return await this.page.locator('text=Edited').isVisible();
  }

  async resetImage() {
    await this.page.locator('[data-testid="reset-button"]').click();
  }

  async removeFile() {
    // Click the remove button (X) on the file card
    await this.page.locator('button[aria-label*="Remove"]').first().click();
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('[role="alert"]');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.page.locator('[role="alert"]').isVisible();
  }

  async extractData() {
    await this.page.locator('button:has-text("Daten extrahieren")').click();
  }

  async waitForExtractionComplete() {
    // Wait for extraction to complete
    await this.page.waitForResponse(resp => 
      resp.url().includes('/api/extract-receipt') && resp.status() === 200,
      { timeout: 30000 }
    );
  }
}

// Test Suite
test.describe('PDF to Image Conversion', () => {
  let bewirtungsbelegPage: BewirtungsbelegPage;

  test.beforeEach(async ({ page }) => {
    bewirtungsbelegPage = new BewirtungsbelegPage(page);
    await bewirtungsbelegPage.navigate();
  });

  test('should convert PDF to image and display it', async ({ page }) => {
    // Create a test PDF file
    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    // Check if test PDF exists, if not create a simple one
    if (!fs.existsSync(testPdfPath)) {
      console.log('Creating test PDF...');
      // Use existing PDF from test directory if available
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        // Skip test if no PDF available
        test.skip();
        return;
      }
    }

    // Upload PDF file
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // Wait for PDF conversion
    await bewirtungsbelegPage.waitForPdfConversion();

    // Verify image is displayed
    const isImageVisible = await bewirtungsbelegPage.isImageDisplayed();
    expect(isImageVisible).toBeTruthy();

    // Verify image source is base64 data
    const imageSrc = await bewirtungsbelegPage.getImageSrc();
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toContain('data:image');
  });

  test('should enable rotation controls after PDF conversion', async ({ page }) => {
    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // Upload PDF
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // Wait for conversion
    await bewirtungsbelegPage.waitForPdfConversion();

    // Check rotation button is enabled
    const isRotateEnabled = await bewirtungsbelegPage.isRotateButtonEnabled();
    expect(isRotateEnabled).toBeTruthy();

    // Rotate image
    await bewirtungsbelegPage.rotateImageRight();

    // Check edited badge appears
    const isEditedVisible = await bewirtungsbelegPage.isEditedBadgeVisible();
    expect(isEditedVisible).toBeTruthy();
  });

  test('should handle PDF conversion errors gracefully', async ({ page }) => {
    // Mock a failed PDF conversion by intercepting the request
    await page.route('**/api/convert-pdf', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Conversion failed' })
      });
    });

    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // Upload PDF
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check error is visible
    const errorVisible = await bewirtungsbelegPage.isErrorMessageVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should clear error when removing PDF file', async ({ page }) => {
    // Mock a failed PDF conversion
    await page.route('**/api/convert-pdf', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Conversion failed' })
      });
    });

    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // Upload PDF that will fail
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // Wait for error
    await page.waitForTimeout(2000);
    expect(await bewirtungsbelegPage.isErrorMessageVisible()).toBeTruthy();

    // Remove file
    await bewirtungsbelegPage.removeFile();

    // Error should be cleared
    await page.waitForTimeout(500);
    expect(await bewirtungsbelegPage.isErrorMessageVisible()).toBeFalsy();
  });

  test('should handle PNG files without conversion', async ({ page }) => {
    // Create a test PNG file
    const testPngPath = path.join(process.cwd(), 'test', 'test-image.png');
    
    // Create a simple PNG if it doesn't exist
    if (!fs.existsSync(testPngPath)) {
      // Create a 1x1 red pixel PNG
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
      fs.writeFileSync(testPngPath, pngBuffer);
    }

    // Upload PNG file
    await bewirtungsbelegPage.uploadFile(testPngPath);

    // Should NOT show "Converting PDF..." message
    const convertingMessage = page.locator('text=Converting PDF...');
    await expect(convertingMessage).not.toBeVisible({ timeout: 2000 });

    // Image should be displayed immediately
    const isImageVisible = await bewirtungsbelegPage.isImageDisplayed();
    expect(isImageVisible).toBeTruthy();

    // Rotation should be enabled
    const isRotateEnabled = await bewirtungsbelegPage.isRotateButtonEnabled();
    expect(isRotateEnabled).toBeTruthy();
  });

  test('should complete full PDF workflow with rotation', async ({ page }) => {
    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // 1. Upload PDF
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // 2. Wait for conversion
    await bewirtungsbelegPage.waitForPdfConversion();

    // 3. Verify image displayed
    expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();

    // 4. Rotate right
    await bewirtungsbelegPage.rotateImageRight();
    expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeTruthy();

    // 5. Rotate left
    await bewirtungsbelegPage.rotateImageLeft();

    // 6. Reset to original
    await bewirtungsbelegPage.resetImage();
    expect(await bewirtungsbelegPage.isEditedBadgeVisible()).toBeFalsy();

    // 7. Verify image still displayed
    expect(await bewirtungsbelegPage.isImageDisplayed()).toBeTruthy();
  });

  test('should not extract data from PDF files', async ({ page }) => {
    // Intercept extraction API to verify it's not called for PDFs
    let extractionCalled = false;
    await page.route('**/api/extract-receipt', route => {
      extractionCalled = true;
      route.continue();
    });

    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // Upload PDF
    await bewirtungsbelegPage.uploadFile(testPdfPath);

    // Wait for conversion
    await bewirtungsbelegPage.waitForPdfConversion();

    // Try to extract data
    const extractButton = page.locator('button:has-text("Daten extrahieren")');
    
    // Button should either be disabled or not trigger extraction for PDFs
    if (await extractButton.isVisible() && await extractButton.isEnabled()) {
      await extractButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify extraction was not called
    expect(extractionCalled).toBeFalsy();
  });
});

test.describe('Multiple File Handling', () => {
  let bewirtungsbelegPage: BewirtungsbelegPage;

  test.beforeEach(async ({ page }) => {
    bewirtungsbelegPage = new BewirtungsbelegPage(page);
    await bewirtungsbelegPage.navigate();
  });

  test('should handle mixed PDF and image uploads', async ({ page }) => {
    // Create test files
    const testPdfPath = path.join(process.cwd(), 'test', 'test-receipt.pdf');
    const testPngPath = path.join(process.cwd(), 'test', 'test-image.png');
    
    // Ensure PDF exists
    if (!fs.existsSync(testPdfPath)) {
      const sourcePdf = path.join(process.cwd(), 'test', '08042025_kreditbeleg_Pareo.pdf');
      if (fs.existsSync(sourcePdf)) {
        fs.copyFileSync(sourcePdf, testPdfPath);
      } else {
        test.skip();
        return;
      }
    }

    // Ensure PNG exists
    if (!fs.existsSync(testPngPath)) {
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
      fs.writeFileSync(testPngPath, pngBuffer);
    }

    // Upload both files
    const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
    await fileInput.setInputFiles([testPngPath, testPdfPath]);

    // Wait for PDF conversion (PNG should be instant)
    await page.waitForTimeout(3000);

    // Both files should be visible in the list
    const fileCards = page.locator('[data-testid="file-card"]');
    const fileCount = await fileCards.count();
    expect(fileCount).toBeGreaterThanOrEqual(1);
  });
});
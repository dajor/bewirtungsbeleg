# Test info

- Name: Image Preview Real-World Test >> Regular image should display immediately in preview
- Location: /Users/daniel/dev/bewir/test/image-preview-real.spec.ts:102:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="file"]')

    at /Users/daniel/dev/bewir/test/image-preview-real.spec.ts:127:5
```

# Page snapshot

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
   27 |     // Upload the PDF file
   28 |     const fileInput = page.locator('input[type="file"]');
   29 |     await fileInput.setInputFiles(testPdfPath);
   30 |     
   31 |     // Wait for file to appear in the uploaded files list
   32 |     await page.waitForTimeout(1000);
   33 |     
   34 |     // Click on the uploaded file to select it (this triggers handleImageChange)
   35 |     // The file card should be clickable
   36 |     const fileCard = page.locator('[data-testid="file-card"], .file-item, div:has-text("08042025_kreditbeleg_Pareo.pdf")').first();
   37 |     
   38 |     if (await fileCard.isVisible()) {
   39 |       console.log('Clicking on file card to select it');
   40 |       await fileCard.click();
   41 |       await page.waitForTimeout(500);
   42 |     }
   43 |     
   44 |     // Now the Image Editor should appear on the right
   45 |     const imageEditor = page.locator('text=Image Editor');
   46 |     await expect(imageEditor).toBeVisible({ timeout: 5000 });
   47 |     console.log('Image Editor is visible');
   48 |     
   49 |     // Check for "Converting PDF..." message
   50 |     const convertingMessage = page.locator('text=Converting PDF...');
   51 |     if (await convertingMessage.isVisible({ timeout: 2000 })) {
   52 |       console.log('PDF conversion in progress...');
   53 |       
   54 |       // Wait for conversion to complete (message should disappear)
   55 |       await expect(convertingMessage).toBeHidden({ timeout: 30000 });
   56 |       console.log('PDF conversion completed');
   57 |     }
   58 |     
   59 |     // Check if the image preview is now visible
   60 |     const imagePreview = page.locator('img[alt="Receipt preview"]');
   61 |     const isImageVisible = await imagePreview.isVisible({ timeout: 5000 });
   62 |     
   63 |     if (isImageVisible) {
   64 |       console.log('✅ SUCCESS: Image preview is visible!');
   65 |       
   66 |       // Get the image source to verify it's a valid data URL
   67 |       const imageSrc = await imagePreview.getAttribute('src');
   68 |       console.log('Image source:', imageSrc?.substring(0, 50) + '...');
   69 |       
   70 |       expect(imageSrc).toBeTruthy();
   71 |       expect(imageSrc).toContain('data:image');
   72 |       
   73 |       // Check if rotation controls are enabled
   74 |       const rotateButton = page.locator('[data-testid="rotate-right-90"]');
   75 |       const isRotateEnabled = await rotateButton.isEnabled();
   76 |       console.log('Rotation controls enabled:', isRotateEnabled);
   77 |       expect(isRotateEnabled).toBeTruthy();
   78 |     } else {
   79 |       // Check for error messages
   80 |       const errorMessage = page.locator('text=Failed to convert PDF');
   81 |       const noPreview = page.locator('text=No preview available');
   82 |       
   83 |       if (await errorMessage.isVisible()) {
   84 |         console.log('❌ FAILURE: PDF conversion error displayed');
   85 |         const errorText = await errorMessage.textContent();
   86 |         console.log('Error:', errorText);
   87 |       } else if (await noPreview.isVisible()) {
   88 |         console.log('❌ FAILURE: "No preview available" is shown');
   89 |       } else {
   90 |         console.log('❌ FAILURE: Image preview not visible and no error shown');
   91 |         
   92 |         // Take a screenshot for debugging
   93 |         await page.screenshot({ path: 'test-results/image-preview-failure.png', fullPage: true });
   94 |         console.log('Screenshot saved to test-results/image-preview-failure.png');
   95 |       }
   96 |       
   97 |       // This should fail the test
   98 |       expect(isImageVisible).toBeTruthy();
   99 |     }
  100 |   });
  101 |
  102 |   test('Regular image should display immediately in preview', async ({ page }) => {
  103 |     await page.goto('/bewirtungsbeleg');
  104 |     await page.waitForLoadState('networkidle');
  105 |     
  106 |     // Create a test PNG file
  107 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  108 |     
  109 |     if (!fs.existsSync(testImagePath)) {
  110 |       // Create a simple PNG if it doesn't exist
  111 |       const pngBuffer = Buffer.from([
  112 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  113 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  114 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  115 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  116 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  117 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  118 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  119 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  120 |         0x44, 0xAE, 0x42, 0x60, 0x82
  121 |       ]);
  122 |       fs.writeFileSync(testImagePath, pngBuffer);
  123 |     }
  124 |     
  125 |     // Upload the image
  126 |     const fileInput = page.locator('input[type="file"]');
> 127 |     await fileInput.setInputFiles(testImagePath);
      |     ^ Error: locator.setInputFiles: Test timeout of 30000ms exceeded.
  128 |     await page.waitForTimeout(1000);
  129 |     
  130 |     // Click on the uploaded file to select it
  131 |     const fileCard = page.locator('[data-testid="file-card"], .file-item').first();
  132 |     if (await fileCard.isVisible()) {
  133 |       await fileCard.click();
  134 |       await page.waitForTimeout(500);
  135 |     }
  136 |     
  137 |     // Image Editor should appear
  138 |     await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 5000 });
  139 |     
  140 |     // Image should be visible immediately (no conversion needed for PNG)
  141 |     const imagePreview = page.locator('img[alt="Receipt preview"]');
  142 |     await expect(imagePreview).toBeVisible({ timeout: 5000 });
  143 |     
  144 |     const imageSrc = await imagePreview.getAttribute('src');
  145 |     console.log('PNG image displayed with src:', imageSrc?.substring(0, 50) + '...');
  146 |     
  147 |     // For regular images, src should be a blob URL
  148 |     expect(imageSrc).toBeTruthy();
  149 |     expect(imageSrc).toMatch(/blob:|data:image/);
  150 |   });
  151 | });
```
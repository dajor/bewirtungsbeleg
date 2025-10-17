# Test info

- Name: Image Preview Real-World Test >> Regular image should display immediately in preview
- Location: /Users/daniel/dev/Bewritung/bewir/test/image-preview-real.spec.ts:103:3

# Error details

```
Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first()

    at /Users/daniel/dev/Bewritung/bewir/test/image-preview-real.spec.ts:129:5
```

# Page snapshot

```yaml
- alert
- dialog:
  - heading "Build Error" [level=1]
  - paragraph: Failed to compile
  - text: Next.js (14.2.29) is outdated
  - link "(learn more)":
    - /url: https://nextjs.org/docs/messages/version-staleness
  - link "./src/lib/opensearch.ts:8:1":
    - text: ./src/lib/opensearch.ts:8:1
    - img
  - text: "Module not found: Can't resolve '@opensearch-project/opensearch' 6 | */ 7 | > 8 | import { Client } from '@opensearch-project/opensearch'; | ^ 9 | // AWS Sigv4 Signer requires aws-sdk v2, which conflicts with our AWS SDK v3 usage 10 | // If you need AWS OpenSearch, install aws-sdk separately or use basic auth 11 | // import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
  - text: "Import trace for requested module:"
  - link "./src/middleware/ensure-user-index.ts":
    - text: ./src/middleware/ensure-user-index.ts
    - img
  - link "./src/lib/auth.ts":
    - text: ./src/lib/auth.ts
    - img
  - link "./src/app/api/auth/[...nextauth]/route.ts":
    - text: ./src/app/api/auth/[...nextauth]/route.ts
    - img
  - contentinfo:
    - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
   29 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   30 |     await fileInput.setInputFiles(testPdfPath);
   31 |     
   32 |     // Wait for file to appear in the uploaded files list
   33 |     await page.waitForTimeout(1000);
   34 |     
   35 |     // Click on the uploaded file to select it (this triggers handleImageChange)
   36 |     // The file card should be clickable
   37 |     const fileCard = page.locator('[data-testid="file-card"], .file-item, div:has-text("08042025_kreditbeleg_Pareo.pdf")').first();
   38 |     
   39 |     if (await fileCard.isVisible()) {
   40 |       console.log('Clicking on file card to select it');
   41 |       await fileCard.click();
   42 |       await page.waitForTimeout(500);
   43 |     }
   44 |     
   45 |     // Now the Image Editor should appear on the right
   46 |     const imageEditor = page.locator('text=Image Editor');
   47 |     await expect(imageEditor).toBeVisible({ timeout: 5000 });
   48 |     console.log('Image Editor is visible');
   49 |     
   50 |     // Check for "Converting PDF..." message
   51 |     const convertingMessage = page.locator('text=Converting PDF...');
   52 |     if (await convertingMessage.isVisible({ timeout: 2000 })) {
   53 |       console.log('PDF conversion in progress...');
   54 |       
   55 |       // Wait for conversion to complete (message should disappear)
   56 |       await expect(convertingMessage).toBeHidden({ timeout: 30000 });
   57 |       console.log('PDF conversion completed');
   58 |     }
   59 |     
   60 |     // Check if the image preview is now visible
   61 |     const imagePreview = page.locator('img[alt="Receipt preview"]');
   62 |     const isImageVisible = await imagePreview.isVisible({ timeout: 5000 });
   63 |     
   64 |     if (isImageVisible) {
   65 |       console.log('✅ SUCCESS: Image preview is visible!');
   66 |       
   67 |       // Get the image source to verify it's a valid data URL
   68 |       const imageSrc = await imagePreview.getAttribute('src');
   69 |       console.log('Image source:', imageSrc?.substring(0, 50) + '...');
   70 |       
   71 |       expect(imageSrc).toBeTruthy();
   72 |       expect(imageSrc).toContain('data:image');
   73 |       
   74 |       // Check if rotation controls are enabled
   75 |       const rotateButton = page.locator('[data-testid="rotate-right-90"]');
   76 |       const isRotateEnabled = await rotateButton.isEnabled();
   77 |       console.log('Rotation controls enabled:', isRotateEnabled);
   78 |       expect(isRotateEnabled).toBeTruthy();
   79 |     } else {
   80 |       // Check for error messages
   81 |       const errorMessage = page.locator('text=Failed to convert PDF');
   82 |       const noPreview = page.locator('text=No preview available');
   83 |       
   84 |       if (await errorMessage.isVisible()) {
   85 |         console.log('❌ FAILURE: PDF conversion error displayed');
   86 |         const errorText = await errorMessage.textContent();
   87 |         console.log('Error:', errorText);
   88 |       } else if (await noPreview.isVisible()) {
   89 |         console.log('❌ FAILURE: "No preview available" is shown');
   90 |       } else {
   91 |         console.log('❌ FAILURE: Image preview not visible and no error shown');
   92 |         
   93 |         // Take a screenshot for debugging
   94 |         await page.screenshot({ path: 'test-results/image-preview-failure.png', fullPage: true });
   95 |         console.log('Screenshot saved to test-results/image-preview-failure.png');
   96 |       }
   97 |       
   98 |       // This should fail the test
   99 |       expect(isImageVisible).toBeTruthy();
  100 |     }
  101 |   });
  102 |
  103 |   test('Regular image should display immediately in preview', async ({ page }) => {
  104 |     await page.goto('/bewirtungsbeleg');
  105 |     await page.waitForLoadState('networkidle');
  106 |     await page.waitForTimeout(500);
  107 |
  108 |     // Create a test PNG file
  109 |     const testImagePath = path.join(process.cwd(), 'test', 'test-receipt.png');
  110 |
  111 |     if (!fs.existsSync(testImagePath)) {
  112 |       // Create a simple PNG if it doesn't exist
  113 |       const pngBuffer = Buffer.from([
  114 |         0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  115 |         0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  116 |         0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  117 |         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  118 |         0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  119 |         0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  120 |         0x00, 0x00, 0x03, 0x00, 0x01, 0x5E, 0xF9, 0x51,
  121 |         0x36, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
  122 |         0x44, 0xAE, 0x42, 0x60, 0x82
  123 |       ]);
  124 |       fs.writeFileSync(testImagePath, pngBuffer);
  125 |     }
  126 |
  127 |     // Upload the image
  128 |     const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
> 129 |     await fileInput.setInputFiles(testImagePath);
      |     ^ Error: locator.setInputFiles: Test timeout of 60000ms exceeded.
  130 |     await page.waitForTimeout(1000);
  131 |     
  132 |     // Click on the uploaded file to select it
  133 |     const fileCard = page.locator('[data-testid="file-card"], .file-item').first();
  134 |     if (await fileCard.isVisible()) {
  135 |       await fileCard.click();
  136 |       await page.waitForTimeout(500);
  137 |     }
  138 |     
  139 |     // Image Editor should appear
  140 |     await expect(page.locator('text=Image Editor')).toBeVisible({ timeout: 5000 });
  141 |     
  142 |     // Image should be visible immediately (no conversion needed for PNG)
  143 |     const imagePreview = page.locator('img[alt="Receipt preview"]');
  144 |     await expect(imagePreview).toBeVisible({ timeout: 5000 });
  145 |     
  146 |     const imageSrc = await imagePreview.getAttribute('src');
  147 |     console.log('PNG image displayed with src:', imageSrc?.substring(0, 50) + '...');
  148 |     
  149 |     // For regular images, src should be a blob URL
  150 |     expect(imageSrc).toBeTruthy();
  151 |     expect(imageSrc).toMatch(/blob:|data:image/);
  152 |   });
  153 | });
```
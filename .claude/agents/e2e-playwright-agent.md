# E2E Playwright Testing Agent

## Purpose
This agent specializes in end-to-end testing using Playwright, ensuring the Bewirtungsbeleg application works correctly from a user's perspective across different browsers and devices.

## Capabilities

### Browser Automation
- Automate user interactions across Chrome, Firefox, Safari
- Test responsive design on different viewports
- Handle file uploads and downloads
- Intercept and mock network requests
- Take screenshots and videos for debugging

### User Journey Testing
- Complete form submission workflows
- PDF upload and conversion flows
- Image rotation and manipulation
- Receipt data extraction verification
- Multi-file handling scenarios

## Core Testing Patterns

### Page Object Model
```typescript
// pages/BewirtungsbelegPage.ts
export class BewirtungsbelegPage {
  constructor(private page: Page) {}
  
  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }
  
  async selectFile(fileName: string) {
    await this.page.click(`[data-testid="file-preview"]:has-text("${fileName}")`);
  }
  
  async rotateImage(degrees: number) {
    await this.page.click(`[data-testid="rotate-${degrees > 0 ? 'right' : 'left'}-90"]`);
  }
}
```

### Test Structure
```typescript
test.describe('PDF to Image Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bewirtungsbeleg');
  });

  test('should convert PDF to image and enable rotation', async ({ page }) => {
    // Upload PDF
    await page.setInputFiles('input[type="file"]', 'public/kundenbewirtung.pdf');
    
    // Wait for conversion
    await page.waitForSelector('text=Converting PDF...', { state: 'visible' });
    await page.waitForSelector('text=Converting PDF...', { state: 'hidden' });
    
    // Verify image is displayed
    await expect(page.locator('img[alt="Receipt preview"]')).toBeVisible();
    
    // Verify rotation controls are enabled
    await expect(page.locator('[data-testid="rotate-right-90"]')).toBeEnabled();
  });
});
```

## Testing Scenarios

### PDF Conversion Flow
```typescript
test.describe('PDF Upload and Conversion', () => {
  test('complete PDF workflow', async ({ page }) => {
    // 1. Navigate to form
    await page.goto('/bewirtungsbeleg');
    
    // 2. Upload PDF file
    const pdfPath = path.join(__dirname, '../public/kundenbewirtung.pdf');
    await page.setInputFiles('input[type="file"]', pdfPath);
    
    // 3. Wait for file to appear in list
    await expect(page.locator('[data-testid="file-preview"]')).toContainText('kundenbewirtung.pdf');
    
    // 4. Click to select the PDF
    await page.click('[data-testid="file-preview"]');
    
    // 5. Wait for conversion
    await expect(page.locator('text=Converting PDF...')).toBeVisible();
    await page.waitForTimeout(2000); // Allow time for conversion
    
    // 6. Verify image is displayed
    await expect(page.locator('img[alt="Receipt preview"]')).toBeVisible();
    
    // 7. Test rotation
    await page.click('[data-testid="rotate-right-90"]');
    await expect(page.locator('text=Edited')).toBeVisible();
  });
});
```

### Error Handling
```typescript
test('should handle PDF conversion failure gracefully', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/convert-pdf', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Conversion failed' })
    });
  });
  
  await page.goto('/bewirtungsbeleg');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  
  // Should show error message
  await expect(page.locator('text=/Failed to convert PDF/')).toBeVisible();
});
```

## Network Interception

### Mock API Responses
```typescript
test.beforeEach(async ({ page }) => {
  // Mock successful PDF conversion
  await page.route('**/api/convert-pdf', async route => {
    const mockImage = 'base64_encoded_image_data';
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        image: mockImage,
        pageCount: 1
      })
    });
  });
});
```

### Monitor Network Activity
```typescript
test('should call conversion API for PDFs', async ({ page }) => {
  const apiCalls: Request[] = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/convert-pdf')) {
      apiCalls.push(request);
    }
  });
  
  await page.goto('/bewirtungsbeleg');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  
  expect(apiCalls.length).toBe(1);
  expect(apiCalls[0].method()).toBe('POST');
});
```

## Visual Testing

### Screenshot Comparisons
```typescript
test('visual regression - PDF viewer', async ({ page }) => {
  await page.goto('/bewirtungsbeleg');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  await page.click('[data-testid="file-preview"]');
  
  // Take screenshot for comparison
  await expect(page.locator('.image-editor')).toHaveScreenshot('pdf-viewer.png');
});
```

### Responsive Testing
```typescript
const viewports = [
  { width: 375, height: 667, name: 'iPhone' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1920, height: 1080, name: 'Desktop' }
];

viewports.forEach(viewport => {
  test(`PDF conversion on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/bewirtungsbeleg');
    // Test PDF conversion at this viewport
  });
});
```

## Performance Testing

```typescript
test('PDF conversion performance', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/bewirtungsbeleg');
  await page.setInputFiles('input[type="file"]', 'large-pdf.pdf');
  
  // Wait for conversion to complete
  await page.waitForSelector('img[alt="Receipt preview"]', { timeout: 30000 });
  
  const conversionTime = Date.now() - startTime;
  expect(conversionTime).toBeLessThan(10000); // Should complete within 10 seconds
});
```

## Accessibility Testing

```typescript
test('keyboard navigation', async ({ page }) => {
  await page.goto('/bewirtungsbeleg');
  
  // Tab to file input
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  
  // Upload file with Enter
  await page.keyboard.press('Enter');
  
  // Navigate to rotation controls
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  
  // Activate rotation with Space
  await page.keyboard.press('Space');
  
  await expect(page.locator('text=Edited')).toBeVisible();
});
```

## Test Configuration

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Debugging E2E Tests

### Debug Mode
```bash
# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Generate trace for debugging
npx playwright test --trace on
```

### Common Issues and Solutions

1. **Element not found**
   - Use more specific selectors
   - Add proper wait conditions
   - Check if element is in shadow DOM

2. **Timeout issues**
   - Increase timeout for slow operations
   - Use explicit waits
   - Check network conditions

3. **Flaky tests**
   - Add retry logic
   - Use stable selectors
   - Mock external dependencies

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Commands

```bash
# Install Playwright
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/pdf-conversion.spec.ts

# Run in headed mode
npx playwright test --headed

# Generate report
npx playwright show-report
```
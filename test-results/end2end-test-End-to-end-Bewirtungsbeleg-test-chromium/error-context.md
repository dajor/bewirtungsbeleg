# Test info

- Name: End-to-end Bewirtungsbeleg test
- Location: /Users/daniel/dev/Bewritung/bewir/test/end2end-test.spec.ts:9:1

# Error details

```
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('h1:has-text("Bewirtungsbeleg")') to be visible

    at /Users/daniel/dev/Bewritung/bewir/test/end2end-test.spec.ts:19:14
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
   1 | import { test, expect } from '@playwright/test';
   2 | import { writeFileSync } from 'fs';
   3 | import path from 'path';
   4 | import { fileURLToPath } from 'url';
   5 |
   6 | const __filename = fileURLToPath(import.meta.url);
   7 | const __dirname = path.dirname(__filename);
   8 |
   9 | test('End-to-end Bewirtungsbeleg test', async ({ page }) => {
   10 |   // Set longer timeout for this test
   11 |   test.setTimeout(60000);
   12 |
   13 |   // Navigate to the Bewirtungsbeleg page
   14 |   await page.goto('/bewirtungsbeleg');
   15 |   await page.waitForLoadState('networkidle');
   16 |   await page.waitForTimeout(500);
   17 |
   18 |   // Wait for the page to load and take screenshot
>  19 |   await page.waitForSelector('h1:has-text("Bewirtungsbeleg")');
      |              ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
   20 |   await page.screenshot({ path: path.join(__dirname, 'screenshot-1-initial.png'), fullPage: true });
   21 |
   22 |   // Upload the PDF file using FileInput
   23 |   const fileInput = page.locator('input[type="file"][accept*="image"], input[type="file"][accept*="pdf"]').first();
   24 |   await fileInput.setInputFiles(path.join(__dirname, 'input.pdf'));
   25 |   
   26 |   // Wait for file to be processed and take screenshot
   27 |   await page.waitForTimeout(3000); // Give more time for OCR
   28 |   await page.screenshot({ path: path.join(__dirname, 'screenshot-2-after-upload.png'), fullPage: true });
   29 |   
   30 |   // Calculate date 30 days ago
   31 |   const date30DaysAgo = new Date();
   32 |   date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
   33 |   const formattedDate = date30DaysAgo.toLocaleDateString('de-DE', {
   34 |     day: '2-digit',
   35 |     month: '2-digit',
   36 |     year: 'numeric'
   37 |   });
   38 |   
   39 |   // Fill out the form fields
   40 |   const formData = {
   41 |     receiptType: 'kunden', // Kundenbewirtung
   42 |     restaurant: 'Restaurant zur goldenen Gans',
   43 |     restaurantAddress: 'Hauptstraße 42, 12345 Berlin',
   44 |     date: formattedDate, // Date 30 days ago
   45 |     occasion: 'Geschäftsessen mit Kunde ABC AG',
   46 |     participants: `Max Mustermann (Musterfirma GmbH)
   47 | Anna Schmidt (ABC AG)
   48 | Peter Wagner (XYZ GmbH)
   49 | Hans Meyer (Eigene Firma)`,
   50 |     totalAmount: '185,50',
   51 |     tipAmount: '18,50',
   52 |     totalWithTip: '204,00'
   53 |   };
   54 |   
   55 |   // Select receipt type (Kundenbewirtung)
   56 |   await page.getByLabel('Kundenbewirtung (70% abzugsfähig)').click();
   57 |   
   58 |   // Fill restaurant information
   59 |   await page.getByLabel('Restaurant').fill(formData.restaurant);
   60 |   await page.getByLabel('Anschrift').fill(formData.restaurantAddress);
   61 |   
   62 |   // Fill date - try different approaches
   63 |   const dateInput = page.getByLabel('Datum der Bewirtung');
   64 |   await dateInput.click();
   65 |   await page.waitForTimeout(1000);
   66 |   
   67 |   // Try to type the date directly if calendar doesn't work well
   68 |   await dateInput.clear();
   69 |   await dateInput.type(formData.date, { delay: 100 });
   70 |   await page.keyboard.press('Enter');
   71 |   await page.waitForTimeout(500);
   72 |   
   73 |   // Fill occasion
   74 |   await page.getByLabel('Geschäftlicher Anlass').fill(formData.occasion);
   75 |   
   76 |   // Take screenshot after filling basic info
   77 |   await page.screenshot({ path: path.join(__dirname, 'screenshot-3-basic-info.png'), fullPage: true });
   78 |   
   79 |   // Fill participants (it's a textarea for customer entertainment)
   80 |   await page.getByLabel('Namen aller Teilnehmer').fill(formData.participants);
   81 |   
   82 |   // Take screenshot after adding participants
   83 |   await page.screenshot({ path: path.join(__dirname, 'screenshot-4-participants.png'), fullPage: true });
   84 |   
   85 |   // Fill amounts - ensure they're visible first
   86 |   await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
   87 |   await page.waitForTimeout(500);
   88 |   
   89 |   // Fill total amount
   90 |   const totalAmountInput = page.getByLabel('Gesamtbetrag (Brutto)');
   91 |   await totalAmountInput.scrollIntoViewIfNeeded();
   92 |   await totalAmountInput.click();
   93 |   await totalAmountInput.clear();
   94 |   await totalAmountInput.type(formData.totalAmount);
   95 |   
   96 |   // Fill tip
   97 |   const tipInput = page.getByPlaceholder('Trinkgeld in Euro');
   98 |   await tipInput.scrollIntoViewIfNeeded();
   99 |   await tipInput.click();
  100 |   await tipInput.clear();
  101 |   await tipInput.type(formData.tipAmount);
  102 |   
  103 |   // Wait for calculations and form updates
  104 |   await page.waitForTimeout(2000);
  105 |   
  106 |   // Fill the business partner company field
  107 |   await page.getByLabel('Firma der Geschäftspartner').fill('Test Company GmbH');
  108 |   
  109 |   // Fill the business partner names field
  110 |   await page.getByLabel('Namen der Geschäftspartner').fill('John Doe\nJane Smith');
  111 |   
  112 |   // Take screenshot before generating PDF
  113 |   await page.screenshot({ path: path.join(__dirname, 'screenshot-5-complete-form.png'), fullPage: true });
  114 |   
  115 |   // Log form values to see what's actually there
  116 |   const formValues = await page.evaluate(() => {
  117 |     const inputs = document.querySelectorAll('input, textarea');
  118 |     const values = {};
  119 |     inputs.forEach(input => {
```
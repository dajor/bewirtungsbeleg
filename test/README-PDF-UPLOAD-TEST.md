# PDF Upload E2E Test Documentation

## Overview

The `playwright-3-pdf-upload.spec.ts` test provides comprehensive end-to-end testing for the Bewirtungsbeleg PDF upload and OCR extraction workflow.

## Test File Location

- **Test File**: `/test/playwright-3-pdf-upload.spec.ts`
- **Test PDFs**: `/test/test-files/`
  - `19092025_(Vendor).pdf` - Classified as "Rechnung"
  - `19092025_* * Kundenbeleg.pdf` - Classified as "Kreditkartenbeleg"

## What It Tests

### 1. Authentication
- Uses the same test user credentials from `playwright-2-login.spec.ts`
- Automatically logs in before each test
- Navigates to `/bewirtungsbeleg` page

### 2. PDF Upload & Conversion
- Tests single PDF upload (Rechnung)
- Tests single PDF upload (Kreditkartenbeleg)
- Tests multiple PDF uploads simultaneously
- Waits for PDF-to-image conversion to complete
- Verifies "Konvertiere PDF..." indicator disappears

### 3. Document Classification
- Validates PDF files are correctly classified
- Checks for classification badges (RECHNUNG, KREDITKARTENBELEG)
- Tests classification API response

### 4. OCR Data Extraction
- Waits for OCR extraction API calls to complete
- Verifies all financial fields are populated with valid numeric values
- Validates the following fields:
  - **Restaurant Name** - Must not be empty
  - **Restaurant Address** - Optional but logged
  - **Datum der Bewirtung** - Must match DD.MM.YYYY format
  - **Gesamtbetrag (Brutto)** - Must be > 0
  - **MwSt. Gesamtbetrag** - Must be > 0 and ~19% of Brutto
  - **Netto Gesamtbetrag** - Must be > 0 and ~81% of Brutto
  - **Betrag auf Kreditkarte/Bar** - Populated from Kreditkartenbeleg
  - **Trinkgeld** - Optional, calculated if present
  - **MwSt. Trinkgeld** - Auto-calculated if Trinkgeld exists

### 5. Calculated Field Validation
- Verifies MwSt. calculation (19% of Brutto)
- Validates Netto calculation (81% of Brutto)
- Ensures Brutto = Netto + MwSt (within 0.02 EUR tolerance)
- Allows for rounding differences (max 0.10 EUR variance)

### 6. Form Validation
- Checks for validation error messages
- Ensures form is in valid state after OCR
- Tests that required business fields can be filled
- Validates form submission to preview page

### 7. Form Submission
- Fills all required business purpose fields:
  - Geschäftlicher Anlass
  - Teilnehmer
  - Geschäftspartner Namen
  - Geschäftspartner Firma
- Clicks "Weiter" button
- Verifies navigation to `/vorschau` page
- Takes screenshots at each step

## Running the Tests

### Run All PDF Upload Tests
```bash
yarn test:e2e --grep "playwright-pdf-upload"
```

### Run Specific Test Case
```bash
# Run only Rechnung upload test
yarn test:e2e --grep "should upload Rechnung PDF"

# Run only Kreditkartenbeleg test
yarn test:e2e --grep "should upload Kreditkartenbeleg"

# Run multiple files test
yarn test:e2e --grep "should upload both PDFs"

# Run form submission test
yarn test:e2e --grep "should handle form submission"
```

### Run in UI Mode (for debugging)
```bash
yarn playwright test playwright-3-pdf-upload --ui
```

### Run with Debug
```bash
yarn playwright test playwright-3-pdf-upload --debug
```

## Test Structure

### Test Cases

1. **Single Rechnung Upload** (`should upload Rechnung PDF, extract data, and validate all fields`)
   - Uploads a single invoice PDF
   - Validates all financial fields are populated
   - Checks MwSt. and Netto calculations
   - Verifies no validation errors

2. **Single Kreditkartenbeleg Upload** (`should upload Kreditkartenbeleg PDF and validate credit card amount`)
   - Uploads a credit card receipt PDF
   - Validates credit card amount is populated
   - Checks classification badge

3. **Multiple PDF Upload** (`should upload both PDFs and handle multiple files`)
   - Uploads both Rechnung and Kreditkartenbeleg simultaneously
   - Verifies both files are converted and classified
   - Validates both file cards are displayed
   - Checks that data from both files is extracted

4. **Form Submission** (`should handle form submission to preview page`)
   - Uploads PDF and waits for OCR
   - Fills all required business fields
   - Submits form via "Weiter" button
   - Validates navigation to preview page

### Helper Functions

- `parseGermanDecimal(value: string): number` - Converts German decimal format (e.g., "51,90") to number
- `waitForPDFConversion(page, fileName, timeout)` - Waits for PDF conversion to complete
- `waitForOCRExtraction(page, timeout)` - Waits for OCR extraction notification to disappear

## Expected Behavior

### Success Criteria
- All PDFs upload successfully
- PDF-to-image conversion completes within 30 seconds
- OCR extraction populates form fields within 30 seconds
- All financial fields contain valid numeric values
- Calculated fields (MwSt., Netto) are mathematically correct
- No validation errors appear
- Form can be submitted to preview page

### Failure Scenarios
- PDF conversion timeout (> 30 seconds)
- OCR extraction fails or times out
- Missing or empty field values
- Invalid calculated values (MwSt. not ~19%, etc.)
- Validation errors appear after OCR
- Navigation to preview page fails

## Screenshots

The test automatically captures screenshots at key points:
- `pdf-upload-rechnung-start-{timestamp}.png` - Initial state
- `pdf-upload-rechnung-after-ocr-{timestamp}.png` - After OCR extraction
- `pdf-upload-rechnung-before-submit-{timestamp}.png` - Before form submission
- `pdf-upload-kreditkarten-after-ocr-{timestamp}.png` - After Kreditkartenbeleg OCR
- `pdf-upload-both-files-{timestamp}.png` - After uploading both files
- `pdf-upload-before-preview-{timestamp}.png` - Before submitting to preview
- `pdf-upload-preview-page-{timestamp}.png` - Preview page after submission
- Error screenshots on failure

Screenshots are saved to: `/test-results/`

## Debugging Tips

### Check Screenshot Files
If a test fails, check the timestamped screenshots in `/test-results/` to see the exact state of the page.

### Check Console Logs
The test includes extensive console logging at each step. Check the test output for:
- API response statuses
- OCR extraction data
- Field values after extraction
- Calculation results

### Common Issues

1. **PDF Conversion Timeout**
   - Check if `/api/convert-pdf` endpoint is working
   - Verify PDF file exists in `/test/test-files/`
   - Check server logs for errors

2. **OCR Extraction Fails**
   - Verify OpenAI API key is configured
   - Check rate limiting (5 requests/minute)
   - Review `/api/extract-receipt` endpoint logs

3. **Validation Errors After OCR**
   - Check if OCR returned invalid data
   - Verify German decimal format conversion
   - Check if required fields are missing

4. **Form Submission Fails**
   - Ensure all required business fields are filled
   - Check for validation error alerts
   - Verify preview page route exists

## CI/CD Integration

The test is configured to run in CI/CD with:
- **Retries**: 2 retries on failure (in CI)
- **Workers**: 1 worker in CI (sequential execution)
- **Timeout**: 30 seconds per API call
- **Screenshots**: On failure for debugging

## Test Dependencies

- Requires `playwright-2-login.spec.ts` test user to exist
- Requires development server running on `http://localhost:3000`
- Requires test PDF files in `/test/test-files/`
- Requires valid OpenAI API key for OCR

## Related Files

- `/src/app/components/BewirtungsbelegForm.tsx` - Main form component
- `/src/app/components/MultiFileDropzone.tsx` - File upload component
- `/src/app/api/convert-pdf/route.ts` - PDF conversion API
- `/src/app/api/classify-receipt/route.ts` - Classification API
- `/src/app/api/extract-receipt/route.ts` - OCR extraction API
- `/playwright.config.ts` - Playwright configuration

## Maintenance Notes

- Update TEST_USER credentials if login test changes
- Add new test PDFs to `/test/test-files/` if needed
- Update field selectors if form structure changes
- Adjust timeout values based on API performance
- Keep calculation tolerance values reasonable (currently 0.10 EUR for MwSt.)

## Contributing

When adding new tests:
1. Follow the existing pattern with console logging
2. Add screenshots at key steps
3. Use German field labels and placeholders
4. Include validation of calculated fields
5. Test both success and error scenarios
6. Document expected behavior in comments

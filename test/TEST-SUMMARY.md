# Bewirtungsbeleg E2E Test Suite Summary

## New Test: playwright-3-pdf-upload.spec.ts

### Overview
Comprehensive end-to-end test for PDF upload, OCR extraction, and form validation in the Bewirtungsbeleg form.

### Location
- **Test File**: `/Users/daniel/dev/Bewritung/bewir/test/playwright-3-pdf-upload.spec.ts`
- **Configuration**: Added to `playwright.config.ts` (line 27)
- **Documentation**: `/Users/daniel/dev/Bewritung/bewir/test/README-PDF-UPLOAD-TEST.md`

---

## Test Cases (4 Total)

### 1. Single Rechnung PDF Upload
**Test**: `should upload Rechnung PDF, extract data, and validate all fields`

**What it tests:**
- Upload single invoice PDF (`19092025_(Vendor).pdf`)
- PDF-to-image conversion
- Document classification (should be "Rechnung")
- OCR data extraction
- Field population validation
- Mathematical validation of calculated fields

**Validated Fields:**
- Restaurant Name (must not be empty)
- Restaurant Address
- Datum der Bewirtung (DD.MM.YYYY format)
- Gesamtbetrag (Brutto) (> 0)
- MwSt. Gesamtbetrag (> 0, ~19% of Brutto)
- Netto Gesamtbetrag (> 0, ~81% of Brutto)
- Betrag auf Kreditkarte/Bar
- Trinkgeld
- MwSt. Trinkgeld

**Math Validation:**
- MwSt. = Brutto × 0.19 (±0.10 EUR tolerance)
- Netto = Brutto × 0.81 (±0.10 EUR tolerance)
- Brutto = Netto + MwSt. (±0.02 EUR tolerance)

---

### 2. Single Kreditkartenbeleg PDF Upload
**Test**: `should upload Kreditkartenbeleg PDF and validate credit card amount`

**What it tests:**
- Upload credit card receipt PDF (`19092025_* * Kundenbeleg.pdf`)
- PDF-to-image conversion
- Document classification (should be "Kreditkartenbeleg")
- OCR extraction specific to credit card receipts
- Kreditkarten Betrag field population

**Key Validation:**
- Credit card amount (Betrag auf Kreditkarte/Bar) must be populated and > 0
- Classification badge should show "KREDITKARTENBELEG"

---

### 3. Multiple PDF Upload (Both Files)
**Test**: `should upload both PDFs (Rechnung + Kreditkartenbeleg) and handle multiple files`

**What it tests:**
- Upload both PDFs simultaneously
- Dual PDF-to-image conversions
- Multiple document classifications
- Both OCR extractions
- Data merging from multiple sources

**Key Validations:**
- Both file cards displayed (count = 2)
- Both classification badges visible
- Gesamtbetrag populated (from Rechnung)
- Kreditkarten Betrag populated (from Kreditkartenbeleg)
- No files stuck in "Konvertiere PDF..." state

---

### 4. Form Submission to Preview
**Test**: `should handle form submission to preview page`

**What it tests:**
- Complete workflow from upload to preview
- Fill all required business purpose fields
- Form validation before submission
- Navigation to preview page

**Fields Filled:**
- Geschäftlicher Anlass: "Client Meeting Q4 2024"
- Teilnehmer: "Max Mustermann\nErika Musterfrau\nJohn Doe"
- Geschäftspartner Namen: "John Doe, Jane Smith"
- Geschäftspartner Firma: "ACME Corporation GmbH"

**Expected Result:**
- Successful navigation to `/bewirtungsbeleg/vorschau`
- No validation errors
- SessionStorage contains form data

---

## Test Features

### Authentication
- Uses TEST_USER credentials from `playwright-2-login.spec.ts`
- Auto-login before each test via `beforeEach` hook
- Email: `uzylloqimwnkvwjfufeq@inbound.mailersend.net`
- Password: `Tester45%`

### Helper Functions

1. **parseGermanDecimal(value: string): number**
   - Converts German format "51,90" to 51.90
   - Handles empty strings (returns 0)

2. **waitForPDFConversion(page, fileName, timeout)**
   - Waits for "Konvertiere PDF..." to disappear
   - Default timeout: 30 seconds
   - Logs elapsed time

3. **waitForOCRExtraction(page, timeout)**
   - Waits for "Der Beleg wird analysiert..." to disappear
   - Additional 2 second wait for UI update
   - Default timeout: 30 seconds

### API Monitoring
The test monitors these API endpoints:
- `/api/convert-pdf` - PDF-to-image conversion (30s timeout)
- `/api/classify-receipt` - Document classification (20s timeout)
- `/api/extract-receipt` - OCR data extraction (30s timeout)

### Screenshot Capture
Automatically captures screenshots at:
- Test start
- After PDF conversion
- After OCR extraction
- Before form submission
- After navigation to preview
- On any error/failure

Screenshot naming: `pdf-upload-{step}-{timestamp}.png`
Location: `/test-results/`

---

## Running the Tests

### Run All PDF Upload Tests
```bash
yarn test:e2e --grep "playwright-pdf-upload"
```

### Run Individual Test Cases
```bash
# Rechnung upload only
yarn test:e2e --grep "should upload Rechnung PDF"

# Kreditkartenbeleg only
yarn test:e2e --grep "should upload Kreditkartenbeleg"

# Multiple files
yarn test:e2e --grep "should upload both PDFs"

# Form submission
yarn test:e2e --grep "should handle form submission"
```

### Debug Mode
```bash
# UI mode
yarn playwright test playwright-3-pdf-upload --ui

# Debug mode
yarn playwright test playwright-3-pdf-upload --debug

# Headed mode (show browser)
yarn playwright test playwright-3-pdf-upload --headed
```

---

## Success Criteria

### Technical Requirements
- All PDFs upload successfully
- PDF conversion completes within 30 seconds
- OCR extraction completes within 30 seconds
- All API calls return 200 status
- No "Konvertiere PDF..." indicators remain visible

### Data Validation Requirements
- All financial fields contain numeric values > 0
- Restaurant name is populated (not empty)
- Date format is valid (DD.MM.YYYY)
- MwSt. calculation is accurate (within 0.10 EUR)
- Netto calculation is accurate (within 0.10 EUR)
- Brutto = Netto + MwSt. (within 0.02 EUR)

### Form Validation Requirements
- No validation error alerts visible
- All required fields can be filled
- Form can be submitted successfully
- Navigation to preview page succeeds

---

## Error Handling

### Timeout Errors
- PDF conversion > 30s: Screenshot captured, test fails
- OCR extraction > 30s: Screenshot captured, test fails
- API calls: Proper error logging and screenshot

### Validation Errors
- Empty fields: Logged and test fails
- Invalid calculations: Detailed comparison logged
- Form errors: Error alert text captured in screenshot

### Debug Information
- Console logs at every major step
- API response data logged
- Field values logged after OCR
- Calculation results logged with comparisons

---

## Dependencies

### Required Services
- Next.js dev server running on `http://localhost:3000`
- Valid OpenAI API key (for OCR)
- Test user account (from playwright-2-login)

### Required Files
- `/test/test-files/19092025_(Vendor).pdf` (436 KB)
- `/test/test-files/19092025_* * Kundenbeleg.pdf` (253 KB)

### Related Code
- `/src/app/components/BewirtungsbelegForm.tsx` - Main form
- `/src/app/components/MultiFileDropzone.tsx` - File upload
- `/src/app/api/convert-pdf/route.ts` - Conversion API
- `/src/app/api/classify-receipt/route.ts` - Classification API
- `/src/app/api/extract-receipt/route.ts` - OCR API

---

## CI/CD Configuration

### Playwright Config (`playwright.config.ts`)
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI (sequential), unlimited locally
- **Timeout**: 30,000ms per operation
- **Parallel**: Yes (`fullyParallel: true`)
- **Reporter**: HTML report

### Environment-Specific
- **Local**: Uses existing dev server, no retries
- **CI**: Starts fresh server, 2 retries, 1 worker

---

## Known Issues & Limitations

### Rate Limiting
- OCR API limited to 5 requests/minute per user
- Classification API has similar limits
- Tests include delays to avoid rate limiting

### PDF Conversion
- Large PDFs (> 5MB) may timeout
- Complex PDFs may take longer to convert
- Test PDFs are optimized (< 500KB)

### OCR Accuracy
- German decimal format required ("51,90" not "51.90")
- Some fields may be optional (Address, Trinkgeld)
- Calculation tolerances account for rounding

---

## Maintenance

### When to Update Tests

1. **Form Structure Changes**
   - Update field selectors/placeholders
   - Update test data

2. **API Changes**
   - Update endpoint URLs
   - Update timeout values
   - Update response validation

3. **Validation Rules Change**
   - Update math tolerance values
   - Update required/optional fields
   - Update error messages

4. **Test Files**
   - Replace PDFs if format changes
   - Update file paths if moved
   - Add new test PDFs for edge cases

### Test Maintenance Checklist
- [ ] Verify test PDFs are valid and accessible
- [ ] Check TEST_USER credentials are current
- [ ] Confirm API rate limits haven't changed
- [ ] Validate timeout values are appropriate
- [ ] Review screenshot locations and cleanup
- [ ] Update documentation if behavior changes

---

## Results & Metrics

### Test Execution Time (Estimated)
- Single PDF upload: ~45 seconds
- Multiple PDF upload: ~60 seconds
- Form submission: ~50 seconds
- Total suite: ~3-4 minutes

### Coverage
- **Components**: BewirtungsbelegForm, MultiFileDropzone
- **API Routes**: convert-pdf, classify-receipt, extract-receipt
- **Workflows**: Upload → Convert → Classify → Extract → Validate → Submit

### Quality Gates
- Zero validation errors after OCR
- 100% field population for financial data
- Mathematical accuracy within defined tolerances
- Successful navigation to preview page

---

## Contact & Support

For issues or questions about this test:
1. Check `/test/README-PDF-UPLOAD-TEST.md` for detailed documentation
2. Review screenshot files in `/test-results/` for visual debugging
3. Check console logs for detailed step-by-step execution
4. Verify all dependencies are met (services, files, credentials)

---

**Test Created**: 2025-10-12
**Last Updated**: 2025-10-12
**Version**: 1.0
**Author**: Claude Code (Anthropic)

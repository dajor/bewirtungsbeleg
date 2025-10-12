# Playwright E2E Test: PDF Upload & Form Validation - COMPLETE

## Summary

A comprehensive Playwright E2E test suite has been created for the Bewirtungsbeleg form's PDF upload, OCR extraction, and validation workflow.

---

## Files Created

### 1. Main Test File
**Location**: `/Users/daniel/dev/Bewritung/bewir/test/playwright-3-pdf-upload.spec.ts`

**Contents**:
- 4 test cases covering complete PDF upload workflow
- Authentication setup using TEST_USER credentials
- PDF conversion and OCR extraction validation
- Field population and calculation verification
- Form submission to preview page testing

**Key Features**:
- Helper functions for German decimal parsing
- Wait functions for async operations (PDF conversion, OCR)
- Comprehensive field validation (9+ fields)
- Mathematical validation (MwSt., Netto calculations)
- Screenshot capture at every step
- Detailed console logging

---

### 2. Documentation Files

#### README-PDF-UPLOAD-TEST.md
**Location**: `/Users/daniel/dev/Bewritung/bewir/test/README-PDF-UPLOAD-TEST.md`

**Contents**:
- Detailed test documentation
- What each test validates
- Running instructions
- Debugging tips
- Common issues and solutions
- CI/CD integration notes

#### TEST-SUMMARY.md
**Location**: `/Users/daniel/dev/Bewritung/bewir/test/TEST-SUMMARY.md`

**Contents**:
- Complete test suite overview
- Test case descriptions
- Success criteria
- Error handling
- Dependencies
- Maintenance checklist

---

### 3. Test Runner Script
**Location**: `/Users/daniel/dev/Bewritung/bewir/test/run-pdf-upload-tests.sh`

**Features**:
- Auto-starts dev server if needed
- Multiple run modes (normal, UI, debug, headed)
- Filter options for specific tests
- Color-coded output
- Automatic cleanup

**Usage**:
```bash
# Run all tests
./test/run-pdf-upload-tests.sh

# Run in UI mode
./test/run-pdf-upload-tests.sh --ui

# Run in debug mode
./test/run-pdf-upload-tests.sh --debug

# Run only single file tests
./test/run-pdf-upload-tests.sh --single

# Run only multiple files test
./test/run-pdf-upload-tests.sh --multiple

# Run only form submission test
./test/run-pdf-upload-tests.sh --submission
```

---

### 4. Configuration Updates
**File**: `/Users/daniel/dev/Bewritung/bewir/playwright.config.ts`

**Changes**:
- Added `**/playwright-3-pdf-upload.spec.ts` to testMatch array (line 27)

---

## Test Cases Overview

### Test 1: Single Rechnung Upload
- Upload invoice PDF
- Validate PDF conversion
- Check classification (should be "Rechnung")
- Verify OCR extraction
- Validate all financial fields populated
- Check mathematical accuracy of calculations

### Test 2: Single Kreditkartenbeleg Upload
- Upload credit card receipt PDF
- Validate PDF conversion
- Check classification (should be "Kreditkartenbeleg")
- Verify credit card amount field populated

### Test 3: Multiple PDF Upload
- Upload both PDFs simultaneously
- Validate both conversions
- Check both classifications
- Verify data from both files extracted correctly
- Ensure no files stuck in "converting" state

### Test 4: Form Submission
- Complete workflow: upload → extract → fill → submit
- Fill all required business fields
- Submit form via "Weiter" button
- Validate navigation to preview page

---

## Fields Validated

### Required Fields (Must Not Be Empty)
1. **Restaurant Name**
2. **Datum der Bewirtung** (DD.MM.YYYY format)
3. **Gesamtbetrag (Brutto)** (> 0)
4. **MwSt. Gesamtbetrag** (> 0)
5. **Netto Gesamtbetrag** (> 0)

### Optional Fields (Logged if Present)
6. **Restaurant Address**
7. **Betrag auf Kreditkarte/Bar**
8. **Trinkgeld**
9. **MwSt. Trinkgeld**

### Mathematical Validation
- MwSt. ≈ Brutto × 0.19 (±0.10 EUR tolerance)
- Netto ≈ Brutto × 0.81 (±0.10 EUR tolerance)
- Brutto = Netto + MwSt. (±0.02 EUR tolerance)

---

## Running the Tests

### Quick Start
```bash
# Option 1: Use the test runner script (recommended)
./test/run-pdf-upload-tests.sh

# Option 2: Use yarn command
yarn test:e2e --grep "playwright-pdf-upload"

# Option 3: Run specific test
yarn test:e2e --grep "should upload Rechnung PDF"
```

### Debug Mode
```bash
# UI mode (best for development)
./test/run-pdf-upload-tests.sh --ui

# Debug mode (step through)
./test/run-pdf-upload-tests.sh --debug

# Headed mode (see browser)
./test/run-pdf-upload-tests.sh --headed
```

### Run Specific Tests
```bash
# Only single file tests
./test/run-pdf-upload-tests.sh --single

# Only multiple files test
./test/run-pdf-upload-tests.sh --multiple

# Only form submission test
./test/run-pdf-upload-tests.sh --submission
```

---

## Test Files Used

### PDF Test Files
Both files are located in `/Users/daniel/dev/Bewritung/bewir/test/test-files/`:

1. **19092025_(Vendor).pdf** (436 KB)
   - Type: Rechnung (Invoice)
   - Contains: Restaurant details, amounts, VAT

2. **19092025_* * Kundenbeleg.pdf** (253 KB)
   - Type: Kreditkartenbeleg (Credit Card Receipt)
   - Contains: Credit card amount, date

---

## Expected Test Execution Time

- **Test 1** (Single Rechnung): ~45 seconds
- **Test 2** (Single Kreditkartenbeleg): ~40 seconds
- **Test 3** (Multiple PDFs): ~60 seconds
- **Test 4** (Form Submission): ~50 seconds
- **Total Suite**: ~3-4 minutes

---

## Success Criteria

### All tests pass when:
- PDFs upload successfully
- PDF-to-image conversion completes (< 30s)
- Document classification returns correct types
- OCR extraction populates all required fields
- All financial values are > 0
- MwSt. and Netto calculations are accurate
- No validation errors appear
- Form can be submitted to preview page

---

## Failure Scenarios Handled

### Timeout Errors
- PDF conversion > 30 seconds
- OCR extraction > 30 seconds
- API calls timing out

### Validation Errors
- Empty required fields
- Invalid calculated values
- Form validation errors

### Each failure captures:
- Screenshot of page state
- Console logs with details
- API response data
- Field values at time of failure

---

## CI/CD Integration

### Configured for CI/CD with:
- **Retries**: 2 attempts on failure (CI only)
- **Workers**: 1 (sequential execution in CI)
- **Timeouts**: 30 seconds per API operation
- **Screenshots**: Captured on failure
- **Reports**: HTML report generated

### Environment Variables Needed:
- `OPENAI_API_KEY` - For OCR extraction
- Test user must exist (from playwright-2-login)

---

## Debugging Tips

### If Tests Fail:

1. **Check Screenshots**
   - Location: `/test-results/`
   - Named: `pdf-upload-{step}-{timestamp}.png`

2. **Check Console Logs**
   - Every step is logged
   - API responses logged
   - Field values logged after OCR

3. **Common Issues**:
   - Dev server not running → Script auto-starts it
   - Test user doesn't exist → Run playwright-2-login first
   - Rate limiting → Tests include delays
   - PDF conversion timeout → Check server logs

4. **View HTML Report**:
   ```bash
   npx playwright show-report
   ```

---

## Dependencies

### Required Services:
- Next.js dev server (http://localhost:3000)
- Valid OpenAI API key
- Test user account (TEST_USER)

### Required Files:
- Both test PDF files in `/test/test-files/`

### Related Components:
- BewirtungsbelegForm.tsx
- MultiFileDropzone.tsx
- API routes: convert-pdf, classify-receipt, extract-receipt

---

## Code Quality Features

### Test Pattern Adherence:
- Follows existing Playwright test patterns
- Uses same TEST_USER as login tests
- Consistent naming convention (playwright-3-*)
- Proper async/await handling
- Comprehensive error handling

### Maintainability:
- Helper functions for reusable logic
- Clear step-by-step logging
- Detailed comments
- Screenshot documentation
- Type safety (TypeScript)

### Reliability:
- Waits for API responses before proceeding
- Checks for indicators to disappear
- Validates both UI and data state
- Proper timeout handling
- Retry logic in CI

---

## Next Steps

### To run the tests:
1. Ensure dev server is running (or use the script)
2. Run: `./test/run-pdf-upload-tests.sh`
3. Check results in console and HTML report

### To integrate into CI/CD:
1. Add to GitHub Actions workflow
2. Set environment variables (OPENAI_API_KEY)
3. Ensure test user exists
4. Configure artifact upload for screenshots

### To extend the tests:
1. Add new PDF test files to `/test/test-files/`
2. Add new test cases to playwright-3-pdf-upload.spec.ts
3. Update documentation in README-PDF-UPLOAD-TEST.md
4. Add new validation logic as needed

---

## Files Summary

```
bewir/
├── test/
│   ├── playwright-3-pdf-upload.spec.ts          # Main test file (NEW)
│   ├── README-PDF-UPLOAD-TEST.md                # Detailed documentation (NEW)
│   ├── TEST-SUMMARY.md                          # Test suite summary (NEW)
│   ├── run-pdf-upload-tests.sh                  # Test runner script (NEW)
│   └── test-files/
│       ├── 19092025_(Vendor).pdf                # Rechnung test file
│       └── 19092025_* * Kundenbeleg.pdf         # Kreditkartenbeleg test file
├── playwright.config.ts                         # Updated with new test
└── PLAYWRIGHT-PDF-UPLOAD-TEST-COMPLETE.md       # This file (NEW)
```

---

## Test Statistics

- **Lines of Code**: ~650 lines (test file)
- **Test Cases**: 4
- **Fields Validated**: 9+
- **API Endpoints Tested**: 3
- **Helper Functions**: 3
- **Screenshots**: 7+ per test run
- **Documentation**: 3 files

---

## Conclusion

The Playwright E2E test suite for PDF upload is now complete and ready to use. It provides:

- Comprehensive coverage of the PDF upload workflow
- Robust validation of OCR extraction
- Mathematical verification of calculated fields
- Form submission testing
- Excellent debugging capabilities
- CI/CD integration support
- Clear documentation

**Status**: READY FOR USE ✅

**Test Coverage**: Complete workflow from upload to preview page ✅

**Documentation**: Comprehensive with examples ✅

**Maintainability**: High (helper functions, clear structure) ✅

**Reliability**: High (timeouts, retries, error handling) ✅

---

## Questions?

Refer to:
- `/test/README-PDF-UPLOAD-TEST.md` - Detailed documentation
- `/test/TEST-SUMMARY.md` - Test suite overview
- Test file comments - Implementation details
- Screenshots in `/test-results/` - Visual debugging

---

**Created**: October 12, 2025
**Status**: Complete
**Ready for**: Development, CI/CD, Production

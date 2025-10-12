# PDF Upload E2E Test - Verification Checklist

## Pre-Test Checklist

Before running the tests, verify:

- [ ] Dev server is running on http://localhost:3000 (or use the test script)
- [ ] Test user exists (email: uzylloqimwnkvwjfufeq@inbound.mailersend.net)
- [ ] OpenAI API key is configured in environment variables
- [ ] Both test PDF files exist:
  - [ ] `/test/test-files/19092025_(Vendor).pdf` (436 KB)
  - [ ] `/test/test-files/19092025_* * Kundenbeleg.pdf` (253 KB)

## Test Execution Verification

Run the test and verify:

- [ ] All 4 test cases execute
- [ ] Authentication succeeds (login before each test)
- [ ] PDF uploads complete without errors
- [ ] PDF-to-image conversion completes (< 30 seconds each)
- [ ] Document classification works (Rechnung/Kreditkartenbeleg)
- [ ] OCR extraction populates all required fields
- [ ] No validation errors appear after OCR
- [ ] Form submission navigates to preview page

## Field Population Verification

After OCR extraction, verify these fields are populated:

- [ ] Restaurant Name (not empty)
- [ ] Datum der Bewirtung (DD.MM.YYYY format)
- [ ] Gesamtbetrag (Brutto) (> 0)
- [ ] MwSt. Gesamtbetrag (> 0)
- [ ] Netto Gesamtbetrag (> 0)
- [ ] Betrag auf Kreditkarte/Bar (from Kreditkartenbeleg)

## Calculation Verification

Check mathematical accuracy:

- [ ] MwSt. ≈ Brutto × 0.19 (within 0.10 EUR)
- [ ] Netto ≈ Brutto × 0.81 (within 0.10 EUR)
- [ ] Brutto = Netto + MwSt. (within 0.02 EUR)

## Test Artifacts Verification

After test execution, check:

- [ ] Screenshots captured in `/test-results/` directory
- [ ] HTML report generated: `npx playwright show-report`
- [ ] Console logs show detailed step information
- [ ] No error screenshots (or if present, investigate)

## CI/CD Integration Verification

For CI/CD setup, verify:

- [ ] Test added to playwright.config.ts
- [ ] Environment variables configured
- [ ] Test runs successfully in CI environment
- [ ] Screenshots uploaded as artifacts (on failure)
- [ ] HTML report generated and accessible

## Quick Test Commands

```bash
# Run all PDF upload tests
./test/run-pdf-upload-tests.sh

# Run in UI mode for debugging
./test/run-pdf-upload-tests.sh --ui

# Run specific test case
yarn test:e2e --grep "should upload Rechnung PDF"

# View test report
npx playwright show-report
```

## Troubleshooting

If tests fail, check:

1. **Screenshots in `/test-results/`** - Visual state at failure
2. **Console logs** - Detailed execution information
3. **HTML report** - Test results and traces
4. **Server logs** - API endpoint errors

Common issues:
- Dev server not running → Use `./test/run-pdf-upload-tests.sh`
- Test user doesn't exist → Run `playwright-2-login.spec.ts` first
- API rate limiting → Wait 1 minute between runs
- PDF conversion timeout → Check file size and server logs

## Success Criteria

All checkboxes above should be checked for successful test execution.

## Sign-off

- [ ] All tests pass
- [ ] Documentation reviewed
- [ ] Test artifacts verified
- [ ] Ready for CI/CD integration

---

**Date**: _______________
**Verified by**: _______________
**Notes**: _______________

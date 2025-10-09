# Release Notes

## Version: Latest
**Date:** 2025-10-09

---

## 🐛 Critical Bug Fix: OCR Tip Calculation

### Fixed Automatic Tip Calculation with OCR

**Problem:**
When uploading invoice and credit card PDFs for OCR extraction, the tip (Trinkgeld) was not automatically calculated, even though both amounts were correctly extracted:
- Invoice: €29.90
- Credit Card: €35.00
- Expected Tip: €5.10 (automatically calculated)
- Actual Result: Tip field remained empty ❌

Manual entry worked correctly - typing the credit card amount would calculate the tip. Only OCR extraction failed.

**Root Cause:**
React's asynchronous state updates caused a race condition:
1. Invoice PDF processed first → sets `gesamtbetrag: 29.90` in form state
2. Credit card PDF processed immediately after → tries to read `form.values.gesamtbetrag`
3. Form state hasn't finished updating yet → `form.values.gesamtbetrag` is empty
4. Tip calculation fails because invoice amount is missing

**Solution:**
- Added `useRef` to track invoice amount across async operations (`lastInvoiceAmountRef`)
- Store invoice amount in ref when processing Rechnung (persists independently of form state)
- Use ref value for tip calculation in credit card handler (guaranteed to have value)
- Added 1-second delay between processing files for UI synchronization
- Calculate both tip amount and tip VAT (19%) during OCR extraction

**Files Modified:**
- `src/app/components/BewirtungsbelegForm.tsx`

**Testing:**
- ✅ Tested with real PDFs: `29092025_(Vendor).pdf` (invoice) and `08102025_Bezahlung MASTERCARD.pdf` (credit card)
- ✅ Verified automatic calculation: €35.00 - €29.90 = €5.10 tip + €0.97 VAT
- ✅ Added comprehensive debug logging (🔍 and 💰 emojis) for troubleshooting
- ✅ Manual entry still works as before

**Impact:**
Users can now upload both invoice and credit card receipts, click "Daten extrahieren", and have the tip automatically calculated without manual intervention.

---

## Previous Release: PDF Classification & Conversion Improvements

**Date:** 2025-10-08

---

## 🎯 Overview

This release fixes critical issues with PDF-to-image conversion and OpenAI classification, adds comprehensive test coverage with both Jest and Vitest, and improves reliability of the PDF processing pipeline.

---

## 🐛 Bug Fixes

### Fixed OpenAI Image Format Rejection (400 Error)

**Problem:** OpenAI API was rejecting PDF-converted images with error:
```
400 You uploaded an unsupported image. Please make sure your image has of one the following formats: ['png', 'jpeg', 'gif', 'webp'].
```

**Root Cause:**
- Client-side PDF.js conversion was producing malformed or corrupted JPEG images
- No validation of image data before sending to OpenAI API
- Missing error handling for format-specific conversion failures

**Solution:**
1. **Switched to Server-Side Conversion**: Changed from client-side PDF.js to reliable server-side pdftoppm conversion
2. **Added Image Validation Layer**: New validation module checks image integrity before OpenAI calls
3. **Implemented Format Fallback**: Automatic retry with PNG if JPEG conversion fails
4. **Enhanced Error Logging**: Detailed error information for debugging conversion issues

---

## ✨ New Features

### 1. Image Validation Module (`src/lib/image-validation.ts`)

Comprehensive image validation before sending to external APIs:

- ✅ Data URL format validation
- ✅ Base64 encoding integrity checks
- ✅ Image header (magic bytes) verification
- ✅ Format normalization (jpg → jpeg)
- ✅ Size validation for API limits
- ✅ Automatic re-encoding for compatibility

**Key Functions:**
- `validateImageDataUrl()` - Validates complete data URL
- `reencodeImageDataUrl()` - Re-encodes for compatibility
- `getBase64ImageSize()` - Calculates image size
- `validateImageSize()` - Checks against size limits

### 2. Enhanced PDF Conversion

**Multi-Format Support (`src/lib/pdf-to-image-multipage.ts`):**
- JPEG and PNG output formats
- Configurable resolution (default: 150 DPI)
- Configurable scale (default: 800px width)
- Automatic format fallback mechanism

**API Enhancements (`src/app/api/convert-pdf/route.ts`):**
- Optional `format` parameter (jpeg/png)
- Better error messages
- Proper timeout handling (30 seconds)

### 3. Vitest Integration

Added Vitest as a modern, fast alternative to Jest:

**Configuration:**
- `vitest.config.ts` - Vitest configuration
- Path alias support (`@/` → `src/`)
- Node environment for server-side tests
- 30-second timeout for PDF operations

**Benefits:**
- Faster test execution
- Better ES modules support
- Modern developer experience
- Compatible with Vite ecosystem

---

## 🧪 Test Coverage

### Total Test Suites: 4 (All Passing ✅)

#### 1. **Jest Tests** (53 tests)

**Image Validation Tests** (`src/lib/image-validation.test.ts`) - 23 tests
- Data URL validation
- Base64 encoding validation
- Image header verification (JPEG, PNG, GIF, WebP)
- Format normalization
- Size validation

**PDF Conversion Tests** (`src/lib/pdf-to-image-multipage.test.ts`) - 18 tests
- JPEG and PNG conversion
- Format fallback mechanisms
- Error handling for corrupted PDFs
- Data URL format validation
- Performance benchmarks

**Integration Tests** (`src/app/api/classify-receipt/pdf-classification.integration.test.ts`) - 12 tests
- Complete PDF → Image → OpenAI classification flow
- Real file testing with:
  - `test/29092025_(Vendor).pdf` → "Rechnung" ✅
  - `test/08102025_Bezahlung MASTERCARD.pdf` → "Kreditkartenbeleg" ✅

#### 2. **Vitest Tests** (14 tests)

**PDF Conversion Tests** (`src/lib/pdf-to-image.vitest.test.ts`) - 14 tests
- File existence validation for both test PDFs
- JPEG conversion (both files) ✅
- PNG conversion (both files) ✅
- OpenAI compatibility validation ✅
- Format fallback verification ✅
- Data URL format validation ✅
- Performance benchmarks (< 10s per conversion) ✅

**Test Results:**
```
✓ Restaurant invoice PDF: 644KB
✓ Credit card receipt PDF: 245KB
✓ Both files convert to JPEG successfully
✓ Both files convert to PNG successfully
✓ All images OpenAI-compatible (< 20MB)
✓ All conversions complete within 10 seconds
```

---

## 🔧 Technical Improvements

### PDF Classification API (`src/app/api/classify-receipt/route.ts`)

**Before:**
```typescript
// Directly sent image to OpenAI without validation
image_url: { url: image }
```

**After:**
```typescript
// Validate and re-encode image before sending
const validation = validateImageDataUrl(image);
if (!validation.valid) {
  // Return graceful fallback classification
}
const validatedImageUrl = reencodeImageDataUrl(image);
image_url: { url: validatedImageUrl }
```

**Benefits:**
- Catches corrupted images before OpenAI call
- Provides detailed error logging
- Graceful degradation instead of breaking user flow
- Better debugging information

### Form Component (`src/app/components/BewirtungsbelegForm.tsx`)

**Before:**
```typescript
// Used client-side PDF.js conversion (unreliable)
const imageData = await PDFToImageConverter.convert(file, {
  method: 'digitalocean',  // Client-side + external API
  page: 1
});
```

**After:**
```typescript
// Uses server-side conversion (reliable)
const imageData = await PDFToImageConverter.convert(file, {
  method: 'local',  // Server-side pdftoppm
  page: 1
});
```

**Benefits:**
- More reliable conversion using native pdftoppm
- Better error handling
- Consistent results across environments
- No external API dependency

---

## 📊 Performance Metrics

### Conversion Times (Average)
- Restaurant invoice (644KB): ~140ms (JPEG), ~1000ms (PNG)
- Credit card receipt (245KB): ~100ms (JPEG), ~800ms (PNG)
- All conversions complete well within 10-second timeout

### Image Sizes (After Conversion)
- Restaurant invoice: ~259KB (JPEG), ~800KB (PNG)
- Credit card receipt: ~129KB (JPEG), ~400KB (PNG)
- All images well within 20MB OpenAI limit

### Test Execution
- Jest tests: 4.25s for 53 tests
- Vitest tests: 8.5s for 14 tests (includes actual PDF conversions)

---

## 📁 Files Added/Modified

### New Files
- ✨ `src/lib/image-validation.ts` - Image validation utilities
- ✨ `src/lib/image-validation.test.ts` - Image validation tests (Jest)
- ✨ `src/lib/pdf-to-image-multipage.test.ts` - PDF conversion tests (Jest)
- ✨ `src/lib/pdf-to-image.vitest.test.ts` - PDF conversion tests (Vitest)
- ✨ `src/app/api/classify-receipt/pdf-classification.integration.test.ts` - Integration tests
- ✨ `vitest.config.ts` - Vitest configuration
- ✨ `test/29092025_(Vendor).pdf` - Test file (Restaurant invoice)
- ✨ `test/08102025_Bezahlung MASTERCARD.pdf` - Test file (Credit card receipt)
- ✨ `RELEASE_NOTES.md` - This file

### Modified Files
- 🔧 `src/app/api/classify-receipt/route.ts` - Added image validation
- 🔧 `src/app/api/convert-pdf/route.ts` - Added format parameter
- 🔧 `src/lib/pdf-to-image-multipage.ts` - Multi-format support & fallback
- 🔧 `src/lib/pdf-to-image-converter.ts` - Fixed data URL handling
- 🔧 `src/app/components/BewirtungsbelegForm.tsx` - Server-side conversion
- 🔧 `package.json` - Added Vitest dependencies

---

## 🚀 Deployment Notes

### Prerequisites
- `poppler-utils` must be installed (for pdftoppm command)
  - macOS: `brew install poppler`
  - Ubuntu: `sudo apt-get install poppler-utils`
  - Alpine: `apk add poppler-utils`

### Environment Variables
No new environment variables required.

### Database Changes
None.

### Breaking Changes
None. All changes are backward compatible.

---

## 🧪 Testing Instructions

### Run All Tests
```bash
# Jest tests (53 tests)
yarn test src/lib/image-validation.test.ts
yarn test src/lib/pdf-to-image-multipage.test.ts
yarn test src/app/api/classify-receipt/pdf-classification.integration.test.ts

# Vitest tests (14 tests)
npx vitest run src/lib/pdf-to-image.vitest.test.ts

# All tests
yarn test
npx vitest run
```

### Manual Testing
1. Upload `test/29092025_(Vendor).pdf` to the form
2. Verify it classifies as "Rechnung"
3. Verify OCR data extraction works
4. Upload `test/08102025_Bezahlung MASTERCARD.pdf`
5. Verify it classifies as "Kreditkartenbeleg"
6. Verify OCR data extraction works

---

## 📝 Migration Guide

No migration required. The changes are transparent to existing functionality.

---

## 🔮 Future Improvements

1. **Caching**: Add Redis cache for converted images
2. **Batch Processing**: Support multiple PDF pages in one request
3. **Image Optimization**: Compress images before OpenAI upload
4. **Progress Tracking**: Real-time conversion progress for large files
5. **WebP Support**: Add WebP output format for better compression

---

## 👥 Contributors

- Claude Assistant (AI Development)
- Daniel Jordan (Review & Testing)

---

## 📄 License

Same as main project license.

---

## 🆘 Support

For issues or questions:
1. Check test files in `test/` directory
2. Review error logs in `/api/classify-receipt` and `/api/convert-pdf`
3. Verify `poppler-utils` is installed
4. Run test suite to verify environment

---

**END OF RELEASE NOTES**

# Changelog

All notable changes to this project will be documented in this file.

## [0.11.0] - 2024-12-18

### Added
- Document classification for receipts (Rechnung vs Kreditkartenbeleg) using OpenAI Vision API
- Visual badges showing document type in file upload area
- Different OCR extraction strategies based on document type
- Validation requiring Rechnung when Kreditkartenbeleg is present
- Automatic sorting of attachments in PDF (Rechnung first, then Kreditkartenbeleg)
- Ability to cancel stuck PDF conversions
- Timeout handling for PDF conversion (25s client-side, 30s server-side)
- Fallback to single-page conversion if multi-page PDF conversion fails
- Better error messages for PDF conversion failures

### Changed
- Kreditkartenbeleg amounts now only fill "Betrag auf Kreditkarte/Bar" field
- Rechnung amounts fill the main financial fields (Gesamtbetrag, MwSt, Netto)
- Improved PDF conversion reliability with timeout and fallback mechanisms
- Enhanced logging for debugging PDF conversion issues

### Fixed
- PDF conversion hanging issue with proper timeout handling
- Race condition where classification wasn't ready for OCR extraction
- OpenAI initialization timing issue causing intermittent 503 errors
- X button now works during PDF conversion to cancel stuck operations

## [0.10.0] - 2024-12-XX

### Fixed
- Attachment processing to completely eliminate empty pages
- Empty page issue in PDF generation - eliminate unnecessary error pages

## [0.9.0] - 2024-12-XX

### Fixed
- PDF and image scaling to preserve original aspect ratio
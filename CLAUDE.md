# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 web application for creating German hospitality receipts (Bewirtungsbelege). It uses TypeScript, Mantine UI, and integrates OpenAI Vision API for OCR functionality.

## Essential Commands

```bash
# Development
yarn dev                 # Start development server on http://localhost:3000

# Testing
yarn test               # Run all tests
yarn test:watch         # Run tests in watch mode
yarn test <file>        # Run specific test file

# Building
yarn build              # Build for production
yarn start              # Start production server (uses custom server.js)

# Linting
yarn lint               # Run ESLint
```

## Architecture Overview

The application follows Next.js 14 App Router conventions with a clear separation of concerns:

1. **API Routes** (`src/app/api/`):
   - `/auth/[...nextauth]` - Authentication endpoints
   - `/classify-receipt` - Determines receipt type (customer/employee)
   - `/extract-receipt` - OCR data extraction using OpenAI Vision
   - `/generate-pdf` - PDF generation with receipt attachment

2. **Main Form Flow** (`src/app/bewirtungsbeleg/`):
   - `BewirtungsbelegForm` component handles the entire receipt creation process
   - File upload → OCR extraction → Form editing → PDF generation
   - German number formatting (comma decimals) and date format (DD.MM.YYYY)

3. **Security Layers**:
   - Authentication via NextAuth.js with role-based access
   - Rate limiting per user/IP using Upstash Redis
   - Input validation with Zod schemas (`src/lib/validation.ts`)
   - HTML sanitization with DOMPurify (`src/lib/sanitize.ts`)

4. **Testing Strategy**:
   - Unit tests for utilities and validation
   - Integration tests for API routes with mocked dependencies
   - Component tests with React Testing Library
   - Mock OpenAI responses in `__mocks__/openai.js`

## Key Technical Decisions

1. **Custom Production Server**: `server.js` handles production deployment with proper error handling
2. **Environment Variables**: Typed and validated in `src/lib/env.ts`
3. **Rate Limiting**: Different limits per endpoint (OCR: 5/min, PDF: 20/min)
4. **File Uploads**: Limited to 10MB, specific image formats only
5. **PDF Generation**: Uses jsPDF with custom templates from `pdf-template/`

## Development Guidelines

1. Always validate user input with the existing Zod schemas
2. Use the German locale for number and date formatting
3. Test API routes with the established mock patterns
4. Maintain type safety - avoid `any` types
5. Follow the existing error handling patterns with proper status codes
# GEMINI.md

This file provides guidance to Google's Gemini models when working with this repository.

## Project Overview

This is a Next.js 14 application for creating German hospitality receipts ("Bewirtungsbelege"). It uses TypeScript, Mantine UI, and the OpenAI Vision API for OCR tasks. The goal is to streamline the process of creating these receipts by automatically extracting data from uploaded documents.

## Quick Reference

For more detailed information on specific aspects of the project, please refer to the following documents:

- **Commands**: `.claude/commands.md`
- **Frontend**: `.claude/frontend.md`
- **Backend/API**: `.claude/api.md`
- **Deployment**: `.claude/deployment.md`
- **Testing**: `.claude/testing.md`

## Core Guidelines

When modifying the codebase, please adhere to the following principles:

1.  **Input Validation**: All user and API input must be rigorously validated using the Zod schemas defined in `src/lib/validation.ts`.
2.  **Localization**: The application targets German users. Ensure that all formatting, especially for dates (DD.MM.YYYY) and numbers (comma as decimal separator), follows German conventions.
3.  **Type Safety**: This is a TypeScript project. Avoid using the `any` type. Strive for strong type definitions to maintain code quality and prevent runtime errors.
4.  **Error Handling**: Follow the existing patterns for error handling. Use `try...catch` blocks for asynchronous operations and provide clear error messages to the user.
5.  **Code Style**: Match the existing coding style, formatting, and naming conventions.

## Key File & Directory Locations

-   **Forms & UI Components**: `src/app/bewirtungsbeleg/` and `src/components/`
-   **API Routes**: `src/app/api/`
-   **Core Logic & Utilities**: `src/lib/`
-   **Type Definitions**: `src/types/`
-   **Tests**: The project uses both Jest/Vitest for unit/integration tests (`src/**/__tests__/`) and Playwright for end-to-end tests (`test/`).

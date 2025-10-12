# Testing Documentation

## Test Structure

```
src/
├── **/__tests__/          # Unit/integration tests (Vitest)
test/
├── test-files/            # Test PDFs and expected results
└── playwright-*.spec.ts   # E2E tests (Playwright)
```

## Unit Tests (Vitest)

### Running Tests
```bash
yarn test                          # All tests
yarn test:watch                    # Watch mode
npx vitest run <file>              # Specific file
```

### Test Files
- `src/lib/__tests__/OcrExtractionIntegration.test.ts`: FormDataAccumulator integration
- `src/lib/__tests__/*.test.ts`: Utility function tests

### Example Test Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { FormDataAccumulator } from '../FormDataAccumulator';

describe('Feature Test', () => {
  it('should do something', () => {
    const accumulator = new FormDataAccumulator(initialValues);
    accumulator.mergeOcrData(mockData, 'Rechnung');

    const result = accumulator.getAccumulatedValues();
    expect(result.field).toBe('expected');
  });
});
```

## E2E Tests (Playwright)

### Running Tests
```bash
npx playwright test                           # All E2E tests
npx playwright test playwright-4-multi-pdf-combinations.spec.ts
```

### Critical Test Suite

**`playwright-4-multi-pdf-combinations.spec.ts`**:
Tests all PDF upload order combinations:
1. Vendor → Kundenbeleg
2. Kundenbeleg → Vendor
3. Vendor → Wait 20s → Kundenbeleg
4. Kundenbeleg → Wait 20s → Vendor

**Verifies**:
- All fields populated (gesamtbetrag, trinkgeld, mwst, etc.)
- No fields cleared during sequential uploads
- Calculations accurate in any order

### Test Files
- `test-files/19092025_(Vendor).pdf`: Sample Rechnung
- `test-files/19092025_* * Kundenbeleg.pdf`: Sample Kreditkartenbeleg
- `test-files/bewirtungsbeleg-2025-10-12.json`: Expected results

## Mock Patterns

### OpenAI
```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => mockOpenAI)
}));
```

### NextAuth
```typescript
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { role: 'admin' } }
  }))
}));
```

### Upstash Redis
```typescript
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis)
}));
```

## Testing Guidelines

1. **Unit tests** for utilities and business logic
2. **Integration tests** for FormDataAccumulator and data flow
3. **E2E tests** for critical user workflows
4. Always test both upload orders for multi-PDF features
5. Mock external services (OpenAI, Redis) in tests
6. Use test files from `test/test-files/` for consistency

## Coverage

Run with coverage:
```bash
yarn test --coverage
```

Reports generated in `coverage/` directory.

# Frontend Documentation

## UI Framework

- **Mantine UI v7**: Component library
- **React 18**: Core framework
- **TypeScript**: Type safety

## Main Components

### BewirtungsbelegForm (`src/app/bewirtungsbeleg/`)

The primary form component handling:
- File upload (PDFs/images)
- OCR data extraction
- Form field management
- PDF generation

**Key Features:**
- German number formatting (comma decimals: `53,90`)
- German date format (DD.MM.YYYY)
- FormDataAccumulator for multi-PDF merging
- Bidirectional field calculations (trinkgeld, MwSt)

### Form Data Flow

```
Upload PDF → OCR Extraction → FormDataAccumulator → Form Fields → PDF Generation
```

## Form Field Calculations

### Automatic Calculations

1. **MwSt (19% VAT)**:
   - From Brutto: `mwst = brutto * 0.19`
   - Missing values auto-calculated

2. **Trinkgeld (Tip)**:
   - `trinkgeld = kreditkartenBetrag - gesamtbetrag`
   - `trinkgeldMwst = trinkgeld * 0.19`
   - Calculated when BOTH fields exist

### Change Handlers

- `handleGesamtbetragChange`: Updates MwSt, Netto, and Trinkgeld
- `handleKreditkartenBetragChange`: Updates Trinkgeld when gesamtbetrag exists

**IMPORTANT**: Calculations are bidirectional - changing either field triggers recalculation.

## FormDataAccumulator (`src/lib/FormDataAccumulator.ts`)

Intelligent data merger for multi-PDF uploads:

```typescript
const accumulator = new FormDataAccumulator(form.values);
accumulator.mergeOcrData(ocrData, 'Rechnung');
accumulator.mergeOcrData(ocrData2, 'Kreditkartenbeleg');
accumulator.applyToForm(form);
```

**Key Behavior:**
- Vendor PDF (Rechnung): Populates all financial fields
- Kundenbeleg PDF: Only updates `kreditkartenBetrag`
- Uses setTimeout (100ms) to prevent race conditions
- Works in any upload order

## German Localization

### Number Format
- Input: `"53,90"` (comma decimal)
- Storage: `"53.90"` (dot decimal)
- Display: `"53,90"` (comma decimal)

### Date Format
- Input: `"19.09.2025"` (DD.MM.YYYY)
- Storage: ISO string
- Display: DD.MM.YYYY

## Common Patterns

### Field Validation
```typescript
import { bewirtungsbelegSchema } from '@/lib/validation';
// Validates all form inputs
```

### Number Input
```typescript
<NumberInput
  data-path="gesamtbetrag"
  decimalSeparator=","
  thousandSeparator="."
  onChange={handleGesamtbetragChange}
/>
```

## Testing

- Component tests: React Testing Library
- E2E tests: Playwright (`test/playwright-*.spec.ts`)
- Integration tests: Vitest (`src/lib/__tests__/`)

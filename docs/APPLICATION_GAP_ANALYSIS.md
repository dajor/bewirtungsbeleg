# Gap Analysis: Current Application vs. Business Requirements

## Current Application Capabilities ✅

### 1. Receipt Processing
- ✅ **OCR via OpenAI Vision API** - Extracts text from uploaded receipts
- ✅ **File Upload** - Supports image formats (JPEG, PNG, etc.)
- ✅ **Data Extraction** - Captures amounts, dates, vendor information

### 2. Form Management
- ✅ **German Formatting** - Comma decimals, DD.MM.YYYY dates
- ✅ **Field Validation** - Zod schemas for input validation
- ✅ **Participant Management** - Basic participant entry

### 3. Document Generation
- ✅ **PDF Creation** - Generates Bewirtungsbeleg PDF
- ✅ **Receipt Attachment** - Embeds original receipt in PDF
- ✅ **Download Capability** - User can save completed document

### 4. Security & Performance
- ✅ **Authentication** - NextAuth with role-based access
- ✅ **Rate Limiting** - Prevents API abuse
- ✅ **Input Sanitization** - DOMPurify for XSS protection

## Critical Gaps to Address 🔴

### 1. Tax Compliance Features
- ❌ **70/30 Split Calculation** - No automatic split for customer entertainment
- ❌ **VAT Rate Differentiation** - No separation of 7% (meals) vs 19% (drinks)
- ❌ **Account Number Assignment** - No SKR03/SKR04 account mapping
- ❌ **Non-deductible Tracking** - No separate handling of 30% portion

### 2. Receipt Classification
- ⚠️  **Basic Classification** - Current `/classify-receipt` endpoint exists but needs enhancement:
  - Missing detailed participant role detection
  - No automatic determination of entertainment type
  - Limited business purpose extraction

### 3. Line Item Processing
- ❌ **Itemized Breakdown** - No separation of meals, drinks, tips
- ❌ **Individual VAT Calculation** - No per-item VAT computation
- ❌ **Tip Detection** - Tips not extracted separately

### 4. Validation & Compliance
- ❌ **Reasonableness Checks** - No warnings for excessive amounts
- ❌ **Completeness Validation** - No check for all required BMF fields
- ❌ **Duplicate Detection** - No prevention of duplicate submissions

## Enhancement Roadmap

### Priority 1: Tax Compliance (Required for Legal Compliance)

#### 1.1 Enhance OCR Extraction (`/api/extract-receipt`)
```typescript
// Add to extraction prompt:
- Separate meals, beverages, and tips
- Identify VAT rates for each line item
- Extract total by VAT rate from receipt
```

#### 1.2 Implement 70/30 Calculator
```typescript
// New utility function needed:
interface TaxSplitCalculation {
  meals: { deductible: number; nonDeductible: number; vat: number };
  drinks: { deductible: number; nonDeductible: number; vat: number };
  tips: { deductible: number; nonDeductible: number };
  total: { deductible: number; nonDeductible: number };
}
```

#### 1.3 Update Form Interface
- Add toggle for entertainment type (Customer/Employee)
- Show 70/30 split in real-time
- Display VAT breakdown by category

### Priority 2: Enhanced Classification

#### 2.1 Improve `/api/classify-receipt`
```typescript
// Enhanced classification logic:
- Analyze participant list for external vs internal
- Extract business purpose from context
- Determine entertainment category with confidence score
```

#### 2.2 Add Participant Role Management
- Dropdown for participant type (Customer/Employee/Prospect)
- Automatic category suggestion based on participants
- Company affiliation tracking

### Priority 3: Data Quality & Validation

#### 3.1 Implement Reasonableness Checks
```typescript
// Warning thresholds:
const THRESHOLDS = {
  perPersonLimit: 150, // EUR per person
  totalLimit: 1000,    // Total receipt amount
  tipPercentage: 15    // Maximum reasonable tip %
};
```

#### 3.2 Add Required Field Validation
- Ensure all BMF-required fields are populated
- Validate business purpose is meaningful
- Check participant information completeness

### Priority 4: Accounting Integration

#### 4.1 Add Export Formats
- DATEV export format
- CSV with proper account numbers
- JSON for API integrations

#### 4.2 Implement Account Mapping
```typescript
interface AccountMapping {
  entertainmentType: 'customer' | 'employee';
  accountingSystem: 'SKR03' | 'SKR04';
  accounts: {
    deductible: string;
    nonDeductible: string;
  };
}
```

## Implementation Impact Assessment

### High Impact, Low Effort (Quick Wins) 🎯
1. Add 70/30 calculation display
2. Enhance OCR prompt for better extraction
3. Add basic reasonableness warnings

### High Impact, Medium Effort (Priority) ⚡
1. Implement full tax split logic
2. Separate VAT rate handling
3. Enhanced participant classification

### Medium Impact, High Effort (Future) 📅
1. Full accounting system integration
2. Advanced duplicate detection
3. Multi-company support

## Technical Debt to Address

1. **Type Safety**: Some areas use loose typing that should be strengthened
2. **Test Coverage**: Need tests for tax calculations and compliance rules
3. **Error Messages**: Localize error messages for German users
4. **Documentation**: Add inline documentation for tax rules

## Recommended Next Steps

1. **Immediate** (Week 1-2):
   - Implement 70/30 split calculation
   - Update OCR extraction for itemized breakdown
   - Add entertainment type selector to form

2. **Short-term** (Week 3-4):
   - Implement VAT rate separation
   - Add reasonableness checks
   - Enhance participant classification

3. **Medium-term** (Month 2):
   - Add export capabilities
   - Implement account number mapping
   - Create compliance dashboard

4. **Long-term** (Month 3+):
   - Integrate with accounting systems
   - Add approval workflows
   - Build analytics features

## Success Criteria

- ✅ All receipts can be properly split 70/30
- ✅ VAT rates correctly identified and calculated
- ✅ 100% BMF compliance for generated documents
- ✅ Reduced processing time from 10 min to 2 min per receipt
- ✅ Zero tax audit findings related to Bewirtungsbelege
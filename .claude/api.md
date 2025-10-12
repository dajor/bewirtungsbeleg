# Backend & API Documentation

## API Routes (`src/app/api/`)

### Authentication
- **`/auth/[...nextauth]`**: NextAuth.js endpoints
  - Role-based access control
  - Session management

### Receipt Processing

#### `/classify-receipt` (POST)
Determines receipt type using OpenAI Vision.

**Input**: Image/PDF file
**Output**: `"Rechnung"` | `"Kreditkartenbeleg"` | `"Eigenbeleg"`
**Rate Limit**: 5/min per user/IP

#### `/extract-receipt` (POST)
Extracts structured data from receipts using OCR.

**Input**:
- `file`: Image/PDF
- `classificationType`: Receipt type

**Output**: JSON with extracted fields:
```json
{
  "restaurantName": "string",
  "restaurantAnschrift": "string",
  "datum": "DD.MM.YYYY",
  "gesamtbetrag": "string",
  "mwst": "string",
  "netto": "string",
  "trinkgeld": "string"
}
```

**Rate Limit**: 5/min per user/IP

#### `/generate-pdf` (POST)
Generates final PDF with receipt attachment.

**Input**: Form data + receipt images
**Output**: PDF file
**Rate Limit**: 20/min per user/IP

### `/convert-pdf` (POST)
Converts PDF pages to images for OCR processing.

**Input**: PDF file
**Output**: Array of image data URLs

## Security

### Rate Limiting
- Powered by Upstash Redis
- Per user/IP tracking
- Different limits per endpoint

### Input Validation
```typescript
// src/lib/validation.ts
export const bewirtungsbelegSchema = z.object({
  // Zod schema for all inputs
});
```

### HTML Sanitization
```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
```

## Environment Variables

Defined in `src/lib/env.ts`:
- `OPENAI_API_KEY`: OpenAI API access
- `UPSTASH_REDIS_REST_URL`: Rate limiting
- `UPSTASH_REDIS_REST_TOKEN`: Rate limiting
- `NEXTAUTH_SECRET`: Auth encryption
- `NEXTAUTH_URL`: Auth callback URL

## File Uploads

**Limits**:
- Max size: 10MB
- Formats: PDF, JPG, PNG, WEBP
- Validated in API routes

## PDF Generation

Uses jsPDF with custom templates from `pdf-template/`:
- German layout
- Receipt attachment
- Digital signature support

## OpenAI Integration

**Mock Configuration** (`__mocks__/openai.js`):
```javascript
// Used in tests to avoid API calls
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};
```

## Testing API Routes

Use established mock patterns:
```typescript
// Mock NextAuth session
jest.mock('next-auth/react');

// Mock OpenAI
jest.mock('openai');

// Mock Upstash Redis
jest.mock('@upstash/redis');
```

## Production Server

Custom `server.js` for production:
- Proper error handling
- Process management
- Health checks

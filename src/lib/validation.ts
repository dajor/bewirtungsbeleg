import { z } from 'zod';

// Helper to validate German decimal format (comma as decimal separator)
const germanDecimalString = z.string().regex(
  /^\d{1,10}(,\d{1,2})?$/,
  'Bitte verwenden Sie das deutsche Zahlenformat (z.B. 123,45)'
);

// Optional German decimal - allows empty string
const optionalGermanDecimalString = z.union([
  germanDecimalString,
  z.literal(''), // Allow empty string
]);

// Helper to parse German decimal to number
export function parseGermanDecimal(value: string): number {
  // Remove thousand separators (dots) and replace comma with dot
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

// Helper to format number to German decimal
export function formatGermanDecimal(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

// Date validation for German format DD.MM.YYYY
const germanDateString = z.string().regex(
  /^\d{2}\.\d{2}\.\d{4}$/,
  'Bitte verwenden Sie das Format TT.MM.JJJJ'
);

// Email validation
const emailSchema = z.string().email('Ungültige E-Mail-Adresse');

// Authentication schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

// Receipt classification schema
export const classifyReceiptSchema = z.object({
  fileName: z.string().min(1, 'Dateiname erforderlich').max(255),
  fileType: z.string().min(1, 'Dateityp erforderlich').max(50),
  image: z.string().optional(), // Base64 image data for content analysis
});

// Extract receipt response schema
export const extractReceiptResponseSchema = z.object({
  restaurantName: z.string().optional(),
  restaurantAnschrift: z.string().optional(),
  gesamtbetrag: z.string().optional(),
  mwst: z.string().optional(),
  netto: z.string().optional(),
  datum: z.string().optional(),
  trinkgeld: z.string().optional(),
  kreditkartenbetrag: z.string().optional(), // For credit card receipts: the paid amount
});

// Bewirtungsbeleg form schema
export const bewirtungsbelegSchema = z.object({
  // Basic information
  datum: z.date({
    required_error: 'Datum ist erforderlich',
    invalid_type_error: 'Ungültiges Datum',
  }),
  restaurantName: z.string().min(1, 'Restaurant Name ist erforderlich').max(200),
  restaurantAnschrift: z.string().max(500).optional(),
  
  // Participants
  teilnehmer: z.string().min(1, 'Teilnehmer sind erforderlich').max(1000),
  anlass: z.string().min(1, 'Anlass ist erforderlich').max(500),
  
  // Amounts (German decimal format)
  gesamtbetrag: germanDecimalString,
  gesamtbetragMwst: optionalGermanDecimalString.optional(),
  gesamtbetragNetto: optionalGermanDecimalString.optional(),
  trinkgeld: optionalGermanDecimalString.optional(),
  trinkgeldMwst: optionalGermanDecimalString.optional(),
  kreditkartenBetrag: optionalGermanDecimalString.optional(),
  
  // Payment and type
  zahlungsart: z.enum(['firma', 'privat', 'bar']),
  bewirtungsart: z.enum(['kunden', 'mitarbeiter']),
  geschaeftlicherAnlass: z.string().max(1000).optional(),
  
  // Business partner info (for Kundenbewirtung)
  geschaeftspartnerNamen: z.string().max(500).optional(),
  geschaeftspartnerFirma: z.string().max(500).optional(),
  
  // Receipt type
  receiptType: z.enum(['rechnung', 'kundenbeleg']).optional(),
  
  // Foreign currency
  istAuslaendischeRechnung: z.boolean().optional(),
  auslaendischeWaehrung: z.string().max(10).optional(),
  fremdwaehrung: z.string().max(3).optional(),
  wechselkurs: germanDecimalString.optional(),
  
  // Eigenbeleg (self-created receipt)
  istEigenbeleg: z.boolean().optional(),
  
  // Image attachment - allow string, undefined, or null for backward compatibility
  image: z.string().optional().nullable(),
  imageData: z.string().optional(),
  imageName: z.string().max(255).optional(),
  
  // Multiple attachments
  attachments: z.array(z.object({
    data: z.string(),
    name: z.string(),
    type: z.string()
  })).optional(),
});

// PDF generation request schema
export const generatePdfSchema = bewirtungsbelegSchema.extend({
  // All fields from bewirtungsbeleg plus potential additional PDF-specific fields
  generateZugferd: z.boolean().optional(), // Enable ZUGFeRD generation
  
  // Additional fields for ZUGFeRD if needed
  unternehmen: z.string().max(200).optional(),
  unternehmenAnschrift: z.string().max(500).optional(),
  unternehmenPlz: z.string().max(10).optional(),
  unternehmenOrt: z.string().max(100).optional(),
  restaurantPlz: z.string().max(10).optional(),
  restaurantOrt: z.string().max(100).optional(),
  
  // Split amounts for VAT calculation
  speisen: optionalGermanDecimalString.optional(),
  getraenke: optionalGermanDecimalString.optional(),
  betragBrutto: optionalGermanDecimalString.optional(),
  bewirtetePersonen: z.string().max(1000).optional(),
});

// Sanitization function for user input
export function sanitizeInput(input: string): string {
  // Remove any potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags completely
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim(); // Trim at the end
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value instanceof Date) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// File validation
export const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  
  validate(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxSize) {
      return { 
        valid: false, 
        error: `Datei ist zu groß. Maximum: ${this.maxSize / 1024 / 1024}MB` 
      };
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Ungültiger Dateityp. Erlaubt sind: JPEG, PNG, WebP, PDF' 
      };
    }
    
    return { valid: true };
  }
};
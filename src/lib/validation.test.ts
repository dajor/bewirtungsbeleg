import {
  parseGermanDecimal,
  formatGermanDecimal,
  sanitizeInput,
  sanitizeObject,
  fileValidation,
  signInSchema,
  classifyReceiptSchema,
  bewirtungsbelegSchema,
} from './validation';

describe('Validation Utilities', () => {
  describe('German Decimal Format', () => {
    it('should parse German decimal to number', () => {
      expect(parseGermanDecimal('123,45')).toBe(123.45);
      expect(parseGermanDecimal('1.234,56')).toBe(1234.56);
      expect(parseGermanDecimal('0,99')).toBe(0.99);
    });

    it('should format number to German decimal', () => {
      expect(formatGermanDecimal(123.45)).toBe('123,45');
      expect(formatGermanDecimal(1234.567)).toBe('1234,57');
      expect(formatGermanDecimal(0.9)).toBe('0,90');
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('JavaScript:void(0)')).toBe('void(0)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick="alert()"')).toBe('"alert()"');
      expect(sanitizeInput('onmouseover = "hack()"')).toBe('"hack()"');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });
  });

  describe('Object Sanitization', () => {
    it('should sanitize string values in objects', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        description: 'onclick="hack()"',
      };
      const output = sanitizeObject(input);
      expect(output.name).toBe('alert("xss")');
      expect(output.description).toBe('"hack()"');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'javascript:void(0)',
          email: '<b>test@example.com</b>',
        },
      };
      const output = sanitizeObject(input);
      expect(output.user.name).toBe('void(0)');
      expect(output.user.email).toBe('test@example.com');
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>tag1</script>', 'onclick="tag2"'],
      };
      const output = sanitizeObject(input);
      expect(output.tags).toEqual(['tag1', '"tag2"']);
    });

    it('should preserve non-string values', () => {
      const date = new Date();
      const input = {
        count: 42,
        active: true,
        date: date,
        nullable: null,
      };
      const output = sanitizeObject(input);
      expect(output).toEqual(input);
    });
  });

  describe('File Validation', () => {
    it('should accept valid image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = fileValidation.validate(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      
      const result = fileValidation.validate(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('zu groß');
    });

    it('should reject invalid file types', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const result = fileValidation.validate(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ungültiger Dateityp');
    });
  });

  describe('Schema Validation', () => {
    describe('signInSchema', () => {
      it('should validate correct sign in data', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        };
        expect(() => signInSchema.parse(data)).not.toThrow();
      });

      it('should reject invalid email', () => {
        const data = {
          email: 'not-an-email',
          password: 'password123',
        };
        expect(() => signInSchema.parse(data)).toThrow();
      });

      it('should reject short password', () => {
        const data = {
          email: 'test@example.com',
          password: '12345',
        };
        expect(() => signInSchema.parse(data)).toThrow();
      });
    });

    describe('classifyReceiptSchema', () => {
      it('should validate correct classification data', () => {
        const data = {
          fileName: 'receipt.jpg',
          fileType: 'image/jpeg',
        };
        expect(() => classifyReceiptSchema.parse(data)).not.toThrow();
      });

      it('should reject empty fileName', () => {
        const data = {
          fileName: '',
          fileType: 'image/jpeg',
        };
        expect(() => classifyReceiptSchema.parse(data)).toThrow();
      });
    });

    describe('bewirtungsbelegSchema', () => {
      it('should validate correct form data', () => {
        const data = {
          datum: new Date(),
          restaurantName: 'Test Restaurant',
          teilnehmer: 'John Doe, Jane Doe',
          anlass: 'Geschäftsessen',
          gesamtbetrag: '123,45',
          zahlungsart: 'firma',
          bewirtungsart: 'kunden',
        };
        expect(() => bewirtungsbelegSchema.parse(data)).not.toThrow();
      });

      it('should validate German decimal format', () => {
        const data = {
          datum: new Date(),
          restaurantName: 'Test',
          teilnehmer: 'Test',
          anlass: 'Test',
          gesamtbetrag: '123.45', // Wrong format
          zahlungsart: 'firma',
          bewirtungsart: 'kunden',
        };
        expect(() => bewirtungsbelegSchema.parse(data)).toThrow();
      });

      it('should accept optional fields', () => {
        const data = {
          datum: new Date(),
          restaurantName: 'Test',
          teilnehmer: 'Test',
          anlass: 'Test',
          gesamtbetrag: '100,00',
          zahlungsart: 'firma',
          bewirtungsart: 'kunden',
          // Optional fields omitted
        };
        expect(() => bewirtungsbelegSchema.parse(data)).not.toThrow();
      });
    });
  });
});
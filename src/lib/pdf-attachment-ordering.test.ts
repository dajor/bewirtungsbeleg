/**
 * Unit Test 5: PDF attachment ordering
 * Critical for German tax compliance - Rechnung must come before Kreditkartenbeleg
 */

interface Attachment {
  data: string;
  name: string;
  type: string;
  order?: number;
}

interface BewirtungsbelegData {
  attachments?: Attachment[];
  receiptType?: 'rechnung' | 'kundenbeleg';
  kreditkartenBetrag?: string;
}

/**
 * Orders attachments according to business rules:
 * 1. Rechnung (invoice) must come first
 * 2. Kreditkartenbeleg (credit card receipt) comes second
 * 3. Other attachments follow
 */
export function orderAttachments(attachments: Attachment[]): Attachment[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  const rechnung: Attachment[] = [];
  const kreditbeleg: Attachment[] = [];
  const other: Attachment[] = [];

  attachments.forEach(attachment => {
    const nameLower = attachment.name.toLowerCase();
    
    if (nameLower.includes('rechnung') || nameLower.includes('invoice')) {
      rechnung.push(attachment);
    } else if (
      nameLower.includes('kreditkarte') || 
      nameLower.includes('kreditbeleg') ||
      nameLower.includes('credit')
    ) {
      kreditbeleg.push(attachment);
    } else {
      other.push(attachment);
    }
  });

  // Return in correct order: Rechnung → Kreditbeleg → Others
  return [...rechnung, ...kreditbeleg, ...other];
}

/**
 * Validates attachment ordering for tax compliance
 */
export function validateAttachmentOrder(attachments: Attachment[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!attachments || attachments.length === 0) {
    return { isValid: true, errors: [] };
  }

  let lastWasRechnung = false;
  let rechnungFound = false;
  let kreditbelegFound = false;
  let kreditbelegBeforeRechnung = false;

  attachments.forEach((attachment, index) => {
    const nameLower = attachment.name.toLowerCase();
    
    if (nameLower.includes('rechnung') || nameLower.includes('invoice')) {
      rechnungFound = true;
      lastWasRechnung = true;
      
      if (kreditbelegFound && !kreditbelegBeforeRechnung) {
        // Rechnung came after Kreditbeleg
        kreditbelegBeforeRechnung = true;
      }
    } else if (
      nameLower.includes('kreditkarte') || 
      nameLower.includes('kreditbeleg') ||
      nameLower.includes('credit')
    ) {
      kreditbelegFound = true;
      lastWasRechnung = false;
      
      if (!rechnungFound) {
        // Kreditbeleg without preceding Rechnung
        kreditbelegBeforeRechnung = true;
      }
    }
  });

  // Validation rules
  if (kreditbelegFound && !rechnungFound) {
    errors.push('Kreditkartenbeleg requires accompanying Rechnung');
  }

  if (kreditbelegBeforeRechnung) {
    errors.push('Rechnung must be attached before Kreditkartenbeleg');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Prepares attachments for PDF generation with proper ordering
 */
export function prepareAttachmentsForPDF(data: BewirtungsbelegData): Attachment[] {
  if (!data.attachments || data.attachments.length === 0) {
    return [];
  }

  // Order attachments
  const ordered = orderAttachments(data.attachments);

  // Add order index for PDF generation
  return ordered.map((attachment, index) => ({
    ...attachment,
    order: index + 1
  }));
}

describe('PDF Attachment Ordering', () => {
  describe('orderAttachments', () => {
    it('should place Rechnung before Kreditkartenbeleg', () => {
      const attachments: Attachment[] = [
        { name: 'kreditkartenbeleg.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'rechnung.pdf', data: 'data1', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      
      expect(ordered[0].name).toBe('rechnung.pdf');
      expect(ordered[1].name).toBe('kreditkartenbeleg.pdf');
    });

    it('should handle multiple Rechnungen and Kreditbelege', () => {
      const attachments: Attachment[] = [
        { name: 'kreditbeleg_2.pdf', data: 'data4', type: 'application/pdf' },
        { name: 'rechnung_2.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'kreditbeleg_1.pdf', data: 'data3', type: 'application/pdf' },
        { name: 'rechnung_1.pdf', data: 'data1', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      
      // All Rechnungen should come first
      expect(ordered[0].name).toContain('rechnung');
      expect(ordered[1].name).toContain('rechnung');
      // Then all Kreditbelege
      expect(ordered[2].name).toContain('kreditbeleg');
      expect(ordered[3].name).toContain('kreditbeleg');
    });

    it('should handle mixed attachments with other documents', () => {
      const attachments: Attachment[] = [
        { name: 'other_document.pdf', data: 'data3', type: 'application/pdf' },
        { name: 'kreditkartenbeleg.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'rechnung.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'speisekarte.pdf', data: 'data4', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      
      expect(ordered[0].name).toBe('rechnung.pdf');
      expect(ordered[1].name).toBe('kreditkartenbeleg.pdf');
      expect(ordered[2].name).toBe('other_document.pdf');
      expect(ordered[3].name).toBe('speisekarte.pdf');
    });

    it('should handle case-insensitive matching', () => {
      const attachments: Attachment[] = [
        { name: 'KREDITKARTENBELEG.PDF', data: 'data2', type: 'application/pdf' },
        { name: 'Rechnung.PDF', data: 'data1', type: 'application/pdf' },
        { name: 'Invoice.pdf', data: 'data3', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      
      // Both Rechnung and Invoice should be treated as invoices
      expect(ordered[0].name).toBe('Rechnung.PDF');
      expect(ordered[1].name).toBe('Invoice.pdf');
      expect(ordered[2].name).toBe('KREDITKARTENBELEG.PDF');
    });

    it('should handle empty array', () => {
      const ordered = orderAttachments([]);
      expect(ordered).toEqual([]);
    });

    it('should handle attachments with only Rechnungen', () => {
      const attachments: Attachment[] = [
        { name: 'rechnung_2.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'rechnung_1.pdf', data: 'data1', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      expect(ordered.length).toBe(2);
      expect(ordered.every(a => a.name.includes('rechnung'))).toBe(true);
    });

    it('should handle English invoice names', () => {
      const attachments: Attachment[] = [
        { name: 'credit_card_receipt.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'invoice_2025.pdf', data: 'data1', type: 'application/pdf' },
      ];

      const ordered = orderAttachments(attachments);
      
      expect(ordered[0].name).toBe('invoice_2025.pdf');
      expect(ordered[1].name).toBe('credit_card_receipt.pdf');
    });
  });

  describe('validateAttachmentOrder', () => {
    it('should validate correct ordering', () => {
      const attachments: Attachment[] = [
        { name: 'rechnung.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'kreditkartenbeleg.pdf', data: 'data2', type: 'application/pdf' },
      ];

      const result = validateAttachmentOrder(attachments);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing Rechnung for Kreditbeleg', () => {
      const attachments: Attachment[] = [
        { name: 'kreditkartenbeleg.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'other.pdf', data: 'data2', type: 'application/pdf' },
      ];

      const result = validateAttachmentOrder(attachments);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Kreditkartenbeleg requires accompanying Rechnung');
    });

    it('should detect wrong ordering', () => {
      const attachments: Attachment[] = [
        { name: 'kreditkartenbeleg.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'rechnung.pdf', data: 'data2', type: 'application/pdf' },
      ];

      const result = validateAttachmentOrder(attachments);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rechnung must be attached before Kreditkartenbeleg');
    });

    it('should allow only Rechnung', () => {
      const attachments: Attachment[] = [
        { name: 'rechnung.pdf', data: 'data1', type: 'application/pdf' },
      ];

      const result = validateAttachmentOrder(attachments);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow other documents without restrictions', () => {
      const attachments: Attachment[] = [
        { name: 'speisekarte.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'notiz.pdf', data: 'data2', type: 'application/pdf' },
      ];

      const result = validateAttachmentOrder(attachments);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty attachments', () => {
      const result = validateAttachmentOrder([]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('prepareAttachmentsForPDF', () => {
    it('should add order index to attachments', () => {
      const data: BewirtungsbelegData = {
        attachments: [
          { name: 'kreditbeleg.pdf', data: 'data2', type: 'application/pdf' },
          { name: 'rechnung.pdf', data: 'data1', type: 'application/pdf' },
        ]
      };

      const prepared = prepareAttachmentsForPDF(data);
      
      expect(prepared[0].name).toBe('rechnung.pdf');
      expect(prepared[0].order).toBe(1);
      expect(prepared[1].name).toBe('kreditbeleg.pdf');
      expect(prepared[1].order).toBe(2);
    });

    it('should handle complex scenarios', () => {
      const data: BewirtungsbelegData = {
        receiptType: 'rechnung',
        kreditkartenBetrag: '119,00',
        attachments: [
          { name: 'photo.jpg', data: 'data4', type: 'image/jpeg' },
          { name: 'kreditbeleg_amex.pdf', data: 'data3', type: 'application/pdf' },
          { name: 'rechnung_restaurant.pdf', data: 'data1', type: 'application/pdf' },
          { name: 'kreditbeleg_visa.pdf', data: 'data2', type: 'application/pdf' },
        ]
      };

      const prepared = prepareAttachmentsForPDF(data);
      
      // Check ordering
      expect(prepared[0].name).toBe('rechnung_restaurant.pdf');
      expect(prepared[0].order).toBe(1);
      
      // Both credit card receipts should follow
      expect(prepared[1].name).toContain('kreditbeleg');
      expect(prepared[1].order).toBe(2);
      expect(prepared[2].name).toContain('kreditbeleg');
      expect(prepared[2].order).toBe(3);
      
      // Other attachments last
      expect(prepared[3].name).toBe('photo.jpg');
      expect(prepared[3].order).toBe(4);
    });

    it('should preserve original attachment data', () => {
      const data: BewirtungsbelegData = {
        attachments: [
          { 
            name: 'rechnung.pdf', 
            data: 'base64encodeddata', 
            type: 'application/pdf' 
          },
        ]
      };

      const prepared = prepareAttachmentsForPDF(data);
      
      expect(prepared[0].data).toBe('base64encodeddata');
      expect(prepared[0].type).toBe('application/pdf');
      expect(prepared[0].name).toBe('rechnung.pdf');
      expect(prepared[0].order).toBe(1);
    });

    it('should handle empty attachments', () => {
      const data: BewirtungsbelegData = {
        attachments: []
      };

      const prepared = prepareAttachmentsForPDF(data);
      expect(prepared).toEqual([]);
    });

    it('should handle missing attachments property', () => {
      const data: BewirtungsbelegData = {};

      const prepared = prepareAttachmentsForPDF(data);
      expect(prepared).toEqual([]);
    });
  });

  describe('Business Rules Compliance', () => {
    it('should enforce German tax requirement: Rechnung before Kreditbeleg', () => {
      // This is a legal requirement in Germany
      const invalidOrder: Attachment[] = [
        { name: 'visa_kreditbeleg.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'restaurant_rechnung.pdf', data: 'data2', type: 'application/pdf' },
      ];

      const validation = validateAttachmentOrder(invalidOrder);
      expect(validation.isValid).toBe(false);

      // Fix the order
      const corrected = orderAttachments(invalidOrder);
      const validationAfterFix = validateAttachmentOrder(corrected);
      expect(validationAfterFix.isValid).toBe(true);
    });

    it('should handle real-world filenames', () => {
      const realWorldAttachments: Attachment[] = [
        { name: '2025-08-06_Kreditkartenbeleg_AMEX.pdf', data: 'data1', type: 'application/pdf' },
        { name: 'Rechnung_Restaurant_Müller_06082025.pdf', data: 'data2', type: 'application/pdf' },
        { name: 'IMG_1234.jpg', data: 'data3', type: 'image/jpeg' },
      ];

      const ordered = orderAttachments(realWorldAttachments);
      
      // Rechnung should be first
      expect(ordered[0].name).toContain('Rechnung');
      // Kreditbeleg second
      expect(ordered[1].name).toContain('Kreditkartenbeleg');
      // Image last
      expect(ordered[2].name).toBe('IMG_1234.jpg');
    });
  });
});
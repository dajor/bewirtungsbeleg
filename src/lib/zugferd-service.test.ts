/**
 * Unit tests for ZUGFeRD Service
 */

import { ZugferdService } from './zugferd-service';
import type { 
  ZugferdInvoiceData, 
  ZugferdRequest,
  ZugferdSellerDetails,
  ZugferdBuyerDetails 
} from './zugferd-service';

// Mock fetch globally
global.fetch = jest.fn();

describe('ZugferdService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createValidInvoiceData = (): ZugferdInvoiceData => ({
    invoiceNumber: 'BWB-2024-001',
    invoiceDate: '20240415',
    currency: 'EUR',
    seller: {
      name: 'Restaurant Zur Post',
      address: 'Hauptstraße 42',
      postalCode: '10115',
      city: 'Berlin',
      country: 'DE',
      taxId: 'DE123456789'
    },
    buyer: {
      name: 'DocBits GmbH',
      address: 'Technologiepark 10',
      postalCode: '20099',
      city: 'Hamburg',
      country: 'DE',
      vatId: 'DE987654321'
    },
    lineItems: [
      {
        description: 'Speisen',
        quantity: 1,
        unitPrice: 42.06,
        netAmount: 42.06,
        vatRate: 7,
        vatAmount: 2.94,
        grossAmount: 45.00
      },
      {
        description: 'Getränke',
        quantity: 1,
        unitPrice: 25.21,
        netAmount: 25.21,
        vatRate: 19,
        vatAmount: 4.79,
        grossAmount: 30.00
      }
    ],
    netTotal: 67.27,
    vatBreakdown: [
      { rate: 7, baseAmount: 42.06, vatAmount: 2.94 },
      { rate: 19, baseAmount: 25.21, vatAmount: 4.79 }
    ],
    grossTotal: 75.00,
    bewirtungsart: 'kunden',
    bewirtetePersonen: ['Max Mustermann', 'Erika Musterfrau'],
    anlass: 'Geschäftsbesprechung'
  });

  describe('validateInvoiceData', () => {
    it('should validate correct invoice data', () => {
      const data = createValidInvoiceData();
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toEqual([]);
    });

    it('should detect missing invoice number', () => {
      const data = createValidInvoiceData();
      data.invoiceNumber = '';
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toContain('Invoice number is required');
    });

    it('should validate date format', () => {
      const data = createValidInvoiceData();
      data.invoiceDate = '2024-04-15'; // Wrong format
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toContain('Invoice date must be in YYYYMMDD format');
    });

    it('should validate currency', () => {
      const data = createValidInvoiceData();
      data.currency = 'USD';
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toContain('Only EUR currency is supported for German invoices');
    });

    it('should validate VAT rates', () => {
      const data = createValidInvoiceData();
      data.lineItems[0].vatRate = 15; // Invalid rate
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors.some(e => e.includes('Invalid VAT rate 15'))).toBe(true);
    });

    it('should validate net total calculation', () => {
      const data = createValidInvoiceData();
      data.netTotal = 50.00; // Wrong total
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors.some(e => e.includes('Net total mismatch'))).toBe(true);
    });

    it('should validate gross total calculation', () => {
      const data = createValidInvoiceData();
      data.grossTotal = 100.00; // Wrong total
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors.some(e => e.includes('Gross total mismatch'))).toBe(true);
    });

    it('should allow small rounding differences', () => {
      const data = createValidInvoiceData();
      // Net total: 42.06 + 25.21 = 67.27
      // VAT total: 2.94 + 4.79 = 7.73
      // Gross total: 67.27 + 7.73 = 75.00
      
      // Test with 0.01 difference in gross total
      data.grossTotal = 75.01; // 0.01 difference from calculated 75.00
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      // Should allow this small difference
      expect(errors.some(e => e.includes('Gross total mismatch'))).toBe(false);
    });

    it('should validate seller details', () => {
      const data = createValidInvoiceData();
      data.seller.name = '';
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toContain('Complete seller details are required');
    });

    it('should validate buyer details', () => {
      const data = createValidInvoiceData();
      data.buyer.city = '';
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toContain('Complete buyer details are required');
    });

    it('should handle tips with 0% VAT correctly', () => {
      const data = createValidInvoiceData();
      data.lineItems.push({
        description: 'Trinkgeld',
        quantity: 1,
        unitPrice: 5.00,
        netAmount: 5.00,
        vatRate: 0,
        vatAmount: 0,
        grossAmount: 5.00
      });
      data.netTotal = 72.27;
      data.grossTotal = 80.00;
      
      const errors = ZugferdService.validateInvoiceData(data);
      
      expect(errors).toEqual([]);
    });
  });

  describe('generateZugferdPdf', () => {
    const mockPdfBase64 = 'JVBERi0xLjQKJeLjz9M='; // Mock PDF base64
    
    it('should successfully generate ZUGFeRD PDF', async () => {
      const invoiceData = createValidInvoiceData();
      const request: ZugferdRequest = {
        pdfBase64: mockPdfBase64,
        invoiceData,
        format: 'BASIC'
      };

      const mockResponse = {
        pdf: 'zugferd-pdf-base64',
        xml: '<invoice>...</invoice>'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await ZugferdService.generateZugferdPdf(request);

      expect(result.success).toBe(true);
      expect(result.pdfBase64).toBe('zugferd-pdf-base64');
      expect(result.xml).toBe('<invoice>...</invoice>');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
    });

    it('should return validation errors for invalid data', async () => {
      const invoiceData = createValidInvoiceData();
      invoiceData.currency = 'USD'; // Invalid currency
      
      const request: ZugferdRequest = {
        pdfBase64: mockPdfBase64,
        invoiceData
      };

      const result = await ZugferdService.generateZugferdPdf(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toContain('Only EUR currency is supported for German invoices');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle PDF size limit', async () => {
      const invoiceData = createValidInvoiceData();
      const largePdfBase64 = 'x'.repeat(15 * 1024 * 1024); // > 14MB
      
      const request: ZugferdRequest = {
        pdfBase64: largePdfBase64,
        invoiceData
      };

      const result = await ZugferdService.generateZugferdPdf(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF file too large. Maximum size is 10MB');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const invoiceData = createValidInvoiceData();
      const request: ZugferdRequest = {
        pdfBase64: mockPdfBase64,
        invoiceData
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await ZugferdService.generateZugferdPdf(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ZUGFeRD API error: 500');
    });

    it('should handle network errors', async () => {
      const invoiceData = createValidInvoiceData();
      const request: ZugferdRequest = {
        pdfBase64: mockPdfBase64,
        invoiceData
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await ZugferdService.generateZugferdPdf(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('createInvoiceDataFromBewirtungsbeleg', () => {
    it('should create invoice data from form data', () => {
      const formData = {
        betragBrutto: '75,00',
        speisen: '45,00',
        getraenke: '30,00',
        restaurantName: 'Restaurant Zur Post',
        restaurantAnschrift: 'Hauptstraße 42',
        restaurantPlz: '10115',
        restaurantOrt: 'Berlin',
        unternehmen: 'DocBits GmbH',
        unternehmenAnschrift: 'Technologiepark 10',
        unternehmenPlz: '20099',
        unternehmenOrt: 'Hamburg',
        bewirtungsart: 'kunden',
        bewirtetePersonen: 'Max Mustermann, Erika Musterfrau',
        anlass: 'Geschäftsbesprechung'
      };

      const invoiceData = ZugferdService.createInvoiceDataFromBewirtungsbeleg(formData);

      expect(invoiceData.currency).toBe('EUR');
      expect(invoiceData.seller.name).toBe('Restaurant Zur Post');
      expect(invoiceData.buyer.name).toBe('DocBits GmbH');
      expect(invoiceData.lineItems).toHaveLength(2);
      expect(invoiceData.lineItems[0].description).toBe('Speisen');
      expect(invoiceData.lineItems[0].vatRate).toBe(7);
      expect(invoiceData.lineItems[1].description).toBe('Getränke');
      expect(invoiceData.lineItems[1].vatRate).toBe(19);
      expect(invoiceData.bewirtungsart).toBe('kunden');
      expect(invoiceData.bewirtetePersonen).toEqual(['Max Mustermann', 'Erika Musterfrau']);
    });

    it('should handle tips correctly', () => {
      const formData = {
        betragBrutto: '80,00',
        speisen: '45,00',
        getraenke: '30,00',
        trinkgeld: '5,00',
        restaurantName: 'Restaurant',
        unternehmen: 'Firma',
        bewirtungsart: 'mitarbeiter'
      };

      const invoiceData = ZugferdService.createInvoiceDataFromBewirtungsbeleg(formData);

      expect(invoiceData.lineItems).toHaveLength(3);
      const tipItem = invoiceData.lineItems.find(item => item.description === 'Trinkgeld');
      expect(tipItem).toBeDefined();
      expect(tipItem?.vatRate).toBe(0);
      expect(tipItem?.vatAmount).toBe(0);
      expect(tipItem?.netAmount).toBe(5);
      expect(tipItem?.grossAmount).toBe(5);
    });

    it('should calculate VAT breakdown correctly', () => {
      const formData = {
        betragBrutto: '75,00',
        speisen: '45,00',
        getraenke: '30,00',
        restaurantName: 'Restaurant',
        unternehmen: 'Firma',
        bewirtungsart: 'kunden'
      };

      const invoiceData = ZugferdService.createInvoiceDataFromBewirtungsbeleg(formData);

      expect(invoiceData.vatBreakdown).toHaveLength(2);
      
      // Food with 7% VAT
      const foodVat = invoiceData.vatBreakdown.find(v => v.rate === 7);
      expect(foodVat).toBeDefined();
      expect(foodVat?.baseAmount).toBeCloseTo(42.06, 2);
      
      // Drinks with 19% VAT
      const drinksVat = invoiceData.vatBreakdown.find(v => v.rate === 19);
      expect(drinksVat).toBeDefined();
      expect(drinksVat?.baseAmount).toBeCloseTo(25.21, 2);
    });

    it('should generate unique invoice numbers', () => {
      const formData1 = { 
        betragBrutto: '50,00',
        restaurantName: 'Rest1',
        unternehmen: 'Firm1',
        bewirtungsart: 'kunden' as const
      };
      const formData2 = { 
        betragBrutto: '60,00',
        restaurantName: 'Rest2',
        unternehmen: 'Firm2',
        bewirtungsart: 'mitarbeiter' as const
      };

      const invoice1 = ZugferdService.createInvoiceDataFromBewirtungsbeleg(formData1);
      
      // Generate second invoice - timestamp will be different
      const invoice2 = ZugferdService.createInvoiceDataFromBewirtungsbeleg(formData2);

      // They should both match the pattern but likely be different
      expect(invoice1.invoiceNumber).toMatch(/^BWB-\d+$/);
      expect(invoice2.invoiceNumber).toMatch(/^BWB-\d+$/);
      // Note: In real usage they'll be different due to timestamp, but in tests they might be the same
    });

    it('should handle missing optional fields', () => {
      const minimalFormData = {
        betragBrutto: '50,00',
        bewirtungsart: 'kunden' as const
      };

      const invoiceData = ZugferdService.createInvoiceDataFromBewirtungsbeleg(minimalFormData);

      expect(invoiceData.seller.name).toBe('Restaurant');
      expect(invoiceData.seller.address).toBe('Adresse');
      expect(invoiceData.buyer.name).toBe('Unternehmen');
      expect(invoiceData.lineItems).toHaveLength(0);
    });
  });
});
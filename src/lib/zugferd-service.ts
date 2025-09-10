/**
 * ZUGFeRD Service for generating tax-compliant electronic invoices
 * Implements ZUGFeRD 2.0 BASIC profile for German tax documentation
 */

export interface ZugferdSellerDetails {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  taxId?: string; // Steuernummer
  vatId?: string; // USt-IdNr
}

export interface ZugferdBuyerDetails {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  taxId?: string;
  vatId?: string;
}

export interface ZugferdLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatRate: number; // 7 for food, 19 for drinks, 0 for tips
  vatAmount: number;
  grossAmount: number;
}

export interface ZugferdInvoiceData {
  // Document metadata
  invoiceNumber: string;
  invoiceDate: string; // YYYYMMDD format
  dueDate?: string; // YYYYMMDD format
  currency: string; // ISO 4217, e.g., 'EUR'
  
  // Parties
  seller: ZugferdSellerDetails;
  buyer: ZugferdBuyerDetails;
  
  // Financial details
  lineItems: ZugferdLineItem[];
  netTotal: number;
  vatBreakdown: {
    rate: number;
    baseAmount: number;
    vatAmount: number;
  }[];
  grossTotal: number;
  
  // Business entertainment specific
  bewirtungsart: 'kunden' | 'mitarbeiter';
  bewirtetePersonen?: string[];
  anlass?: string;
  
  // Payment information
  paymentMethod?: string;
  paymentReference?: string;
}

export interface ZugferdRequest {
  pdfBase64: string; // Base64 encoded PDF (max ~10MB)
  invoiceData: ZugferdInvoiceData;
  format?: 'BASIC' | 'COMFORT' | 'EXTENDED'; // Default: BASIC
}

export interface ZugferdResponse {
  success: boolean;
  pdfBase64?: string; // ZUGFeRD-compliant PDF with embedded XML
  xml?: string; // The ZUGFeRD XML invoice data
  error?: string;
  validationErrors?: string[];
}

export class ZugferdService {
  private static readonly API_URL = process.env.ZUGFERD_API_URL || 
    'https://api.zugferd-bewirtungsbeleg.de/v1/generate';
  
  /**
   * Validates ZUGFeRD invoice data before submission
   */
  static validateInvoiceData(data: ZugferdInvoiceData): string[] {
    const errors: string[] = [];
    
    // Validate invoice number format
    if (!data.invoiceNumber || data.invoiceNumber.length < 1) {
      errors.push('Invoice number is required');
    }
    
    // Validate date format (YYYYMMDD)
    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(data.invoiceDate)) {
      errors.push('Invoice date must be in YYYYMMDD format');
    }
    
    // Validate currency
    if (data.currency !== 'EUR') {
      errors.push('Only EUR currency is supported for German invoices');
    }
    
    // Validate VAT rates
    const validVatRates = [0, 7, 19];
    for (const item of data.lineItems) {
      if (!validVatRates.includes(item.vatRate)) {
        errors.push(`Invalid VAT rate ${item.vatRate}. Must be 0, 7, or 19`);
      }
    }
    
    // Validate amounts
    const calculatedNet = data.lineItems.reduce((sum, item) => sum + item.netAmount, 0);
    const calculatedVat = data.lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const calculatedGross = calculatedNet + calculatedVat;
    
    // Allow small rounding differences (0.01 EUR)
    if (Math.abs(calculatedNet - data.netTotal) > 0.01) {
      errors.push(`Net total mismatch: calculated ${calculatedNet.toFixed(2)}, provided ${data.netTotal.toFixed(2)}`);
    }
    
    if (Math.abs(calculatedGross - data.grossTotal) > 0.01) {
      errors.push(`Gross total mismatch: calculated ${calculatedGross.toFixed(2)}, provided ${data.grossTotal.toFixed(2)}`);
    }
    
    // Validate seller details
    if (!data.seller.name || !data.seller.address || !data.seller.postalCode || !data.seller.city) {
      errors.push('Complete seller details are required');
    }
    
    // Validate buyer details
    if (!data.buyer.name || !data.buyer.address || !data.buyer.postalCode || !data.buyer.city) {
      errors.push('Complete buyer details are required');
    }
    
    return errors;
  }
  
  /**
   * Converts a standard PDF to ZUGFeRD-compliant format
   */
  static async generateZugferdPdf(request: ZugferdRequest): Promise<ZugferdResponse> {
    try {
      // Validate input data
      const validationErrors = this.validateInvoiceData(request.invoiceData);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors
        };
      }
      
      // Check PDF size (approximately 10MB in base64)
      const maxSizeBase64 = 14 * 1024 * 1024; // ~10MB file becomes ~14MB in base64
      if (request.pdfBase64.length > maxSizeBase64) {
        return {
          success: false,
          error: 'PDF file too large. Maximum size is 10MB'
        };
      }
      
      // Call ZUGFeRD API
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          pdf: request.pdfBase64,
          invoice: request.invoiceData,
          profile: request.format || 'BASIC'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZUGFeRD API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        pdfBase64: result.pdf,
        xml: result.xml
      };
      
    } catch (error) {
      console.error('ZUGFeRD generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Creates ZUGFeRD invoice data from Bewirtungsbeleg form data
   */
  static createInvoiceDataFromBewirtungsbeleg(formData: any): ZugferdInvoiceData {
    const today = new Date();
    const invoiceDate = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Parse amounts from German format
    const parseAmount = (value: string | number): number => {
      if (typeof value === 'number') return value;
      return parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''));
    };
    
    const bruttoAmount = parseAmount(formData.betragBrutto);
    const netAmount = bruttoAmount / 1.19; // Assuming 19% VAT for simplicity
    const vatAmount = bruttoAmount - netAmount;
    
    // Determine VAT breakdown based on items
    const vatBreakdown: {
      rate: number;
      baseAmount: number;
      vatAmount: number;
    }[] = [];
    if (formData.speisen) {
      const speisenAmount = parseAmount(formData.speisen);
      const speisenNet = speisenAmount / 1.07;
      vatBreakdown.push({
        rate: 7,
        baseAmount: speisenNet,
        vatAmount: speisenAmount - speisenNet
      });
    }
    
    if (formData.getraenke) {
      const getraenkeAmount = parseAmount(formData.getraenke);
      const getraenkeNet = getraenkeAmount / 1.19;
      vatBreakdown.push({
        rate: 19,
        baseAmount: getraenkeNet,
        vatAmount: getraenkeAmount - getraenkeNet
      });
    }
    
    if (formData.trinkgeld) {
      const trinkgeldAmount = parseAmount(formData.trinkgeld);
      vatBreakdown.push({
        rate: 0,
        baseAmount: trinkgeldAmount,
        vatAmount: 0
      });
    }
    
    // Create line items
    const lineItems: ZugferdLineItem[] = [];
    
    if (formData.speisen) {
      const amount = parseAmount(formData.speisen);
      const net = amount / 1.07;
      lineItems.push({
        description: 'Speisen',
        quantity: 1,
        unitPrice: net,
        netAmount: net,
        vatRate: 7,
        vatAmount: amount - net,
        grossAmount: amount
      });
    }
    
    if (formData.getraenke) {
      const amount = parseAmount(formData.getraenke);
      const net = amount / 1.19;
      lineItems.push({
        description: 'Getränke',
        quantity: 1,
        unitPrice: net,
        netAmount: net,
        vatRate: 19,
        vatAmount: amount - net,
        grossAmount: amount
      });
    }
    
    if (formData.trinkgeld) {
      const amount = parseAmount(formData.trinkgeld);
      lineItems.push({
        description: 'Trinkgeld',
        quantity: 1,
        unitPrice: amount,
        netAmount: amount,
        vatRate: 0,
        vatAmount: 0,
        grossAmount: amount
      });
    }
    
    // Calculate totals
    const calculatedNetTotal = lineItems.reduce((sum, item) => sum + item.netAmount, 0);
    const calculatedVatTotal = lineItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const calculatedGrossTotal = calculatedNetTotal + calculatedVatTotal;
    
    return {
      invoiceNumber: `BWB-${Date.now()}`,
      invoiceDate,
      currency: 'EUR',
      seller: {
        name: formData.restaurantName || 'Restaurant',
        address: formData.restaurantAnschrift || 'Adresse',
        postalCode: formData.restaurantPlz || '00000',
        city: formData.restaurantOrt || 'Stadt',
        country: 'DE'
      },
      buyer: {
        name: formData.unternehmen || 'Unternehmen',
        address: formData.unternehmenAnschrift || 'Adresse',
        postalCode: formData.unternehmenPlz || '00000',
        city: formData.unternehmenOrt || 'Stadt',
        country: 'DE'
      },
      lineItems,
      netTotal: calculatedNetTotal,
      vatBreakdown,
      grossTotal: calculatedGrossTotal,
      bewirtungsart: formData.bewirtungsart,
      bewirtetePersonen: formData.bewirtetePersonen?.split(',').map((p: string) => p.trim()),
      anlass: formData.anlass
    };
  }
}

export default ZugferdService;
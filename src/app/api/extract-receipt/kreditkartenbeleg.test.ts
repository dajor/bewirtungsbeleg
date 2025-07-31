import { POST } from './route';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Mock NextResponse before other imports
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      });
      return response;
    }
  }
}));

// Mock other dependencies
jest.mock('@/lib/rate-limit', () => ({
  apiRatelimit: {
    ocr: { limit: 5, duration: 60000 }
  },
  checkRateLimit: jest.fn().mockResolvedValue(null),
  getIdentifier: jest.fn().mockReturnValue('test-identifier')
}));

jest.mock('@/lib/check-openai', () => ({
  checkOpenAIKey: jest.fn().mockResolvedValue({ valid: true })
}));

jest.mock('@/lib/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key'
  }
}));

jest.mock('@/lib/validation', () => ({
  fileValidation: {
    validate: jest.fn().mockReturnValue({ valid: true })
  },
  extractReceiptResponseSchema: {
    parse: (data: any) => data
  },
  sanitizeObject: (obj: any) => obj
}));

jest.mock('@/lib/sanitize', () => ({
  sanitizeFilename: (name: string) => name
}));

jest.mock('@/lib/pdf-to-image', () => ({
  isPdfFile: jest.fn().mockResolvedValue(false),
  convertPdfToImage: jest.fn()
}));

describe('Extract Receipt API - Kreditkartenbeleg', () => {
  const mockCreate = (OpenAI as any).mockCreate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReset();
  });

  it('should extract credit card receipt data correctly', async () => {
    // Mock OpenAI response for Kreditkartenbeleg
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Pareo Restaurant',
            datum: '08.04.2025',
            gesamtbetrag: '100,00',
            trinkgeld: null,
            mwst: null,
            netto: null
          })
        }
      }]
    });

    // Create test form data with proper File mock
    const formData = new FormData();
    const testFile = new File(['test image data'], 'kreditbeleg.jpg', { type: 'image/jpeg' });
    // Add arrayBuffer method to File
    testFile.arrayBuffer = async () => new TextEncoder().encode('test image data').buffer;
    formData.append('image', testFile);
    formData.append('classificationType', 'Kreditkartenbeleg');

    // Create a mock request with formData method
    const request = {
      formData: async () => formData,
      headers: new Headers(),
      url: 'http://localhost:3000/api/extract-receipt'
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      restaurantName: 'Pareo Restaurant',
      datum: '08.04.2025',
      gesamtbetrag: '100,00'
    });
    
    // Verify correct prompt was used
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                text: expect.stringContaining('Dies ist ein Kreditkartenbeleg')
              })
            ])
          })
        ])
      })
    );
  });

  it('should handle receipt with two amounts and calculate tip', async () => {
    // Mock OpenAI response for Rechnung with two amounts
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Test Restaurant',
            datum: '31.07.2025',
            gesamtbetrag: '95,30',
            mwst: '15,21',
            netto: '80,09',
            trinkgeld: '4,70' // Difference between 100 and 95.30
          })
        }
      }]
    });

    const formData = new FormData();
    const testFile = new File(['test image data'], 'rechnung.jpg', { type: 'image/jpeg' });
    testFile.arrayBuffer = async () => new TextEncoder().encode('test image data').buffer;
    formData.append('image', testFile);
    formData.append('classificationType', 'Rechnung');

    const request = {
      formData: async () => formData,
      headers: new Headers(),
      url: 'http://localhost:3000/api/extract-receipt'
    } as unknown as Request;

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.trinkgeld).toBe('4,70');
  });

  it('should use Rechnung prompt when classification is Rechnung', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Test',
            gesamtbetrag: '50,00'
          })
        }
      }]
    });

    const formData = new FormData();
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    testFile.arrayBuffer = async () => new TextEncoder().encode('test').buffer;
    formData.append('image', testFile);
    formData.append('classificationType', 'Rechnung');

    const request = {
      formData: async () => formData,
      headers: new Headers(),
      url: 'http://localhost:3000/api/extract-receipt'
    } as unknown as Request;

    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                text: expect.stringContaining('Dies ist eine Restaurantrechnung')
              })
            ])
          })
        ])
      })
    );
  });

  it('should use default prompt when no classification is provided', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Test',
            gesamtbetrag: '50,00'
          })
        }
      }]
    });

    const formData = new FormData();
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    testFile.arrayBuffer = async () => new TextEncoder().encode('test').buffer;
    formData.append('image', testFile);
    // No classificationType

    const request = {
      formData: async () => formData,
      headers: new Headers(),
      url: 'http://localhost:3000/api/extract-receipt'
    } as unknown as Request;

    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                text: expect.stringContaining('Extrahiere diese Informationen aus der Rechnung')
              })
            ])
          })
        ])
      })
    );
  });
});
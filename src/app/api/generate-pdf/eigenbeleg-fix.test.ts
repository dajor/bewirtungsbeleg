/**
 * Integration test for the Eigenbeleg validation fix
 * Tests the exact API call that was failing with "image: Expected string, received null"
 */

import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/pdf-to-image', () => ({
  convertPdfToImage: jest.fn(),
}));

jest.mock('@/lib/pdf-to-image-multipage', () => ({
  convertPdfToImagesAllPages: jest.fn(),
}));

jest.mock('@/lib/zugferd-service', () => ({
  ZugferdService: {
    generateZugferdXml: jest.fn().mockReturnValue('<xml>mock</xml>'),
  },
}));

// Mock fs for logo reading
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock-logo-data')),
}));

describe('Generate PDF API - Eigenbeleg Fix', () => {
  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Headers(),
      url: 'http://localhost:3000/api/generate-pdf',
      method: 'POST',
    } as NextRequest;
  };

  test('should handle Eigenbeleg request with null image (original failing case)', async () => {
    const eigeneBelegData = {
      datum: new Date('2025-07-07T00:00:00.000Z'),
      restaurantName: 'OSTERIA DEL PARCO',
      restaurantAnschrift: 'Anzinger St 1 85586 Poing',
      teilnehmer: 'Daniel Jordan, Sehrish Abhul',
      anlass: 'Mitarbeiterbesprechung',
      geschaeftlicherAnlass: 'Mitarbeiterbesprechung',
      gesamtbetrag: '37,00',
      gesamtbetragMwst: '7,03',
      gesamtbetragNetto: '29,97',
      zahlungsart: 'firma',
      bewirtungsart: 'mitarbeiter',
      istEigenbeleg: true,
      // This was the problematic field
      image: null,
      attachments: [],
      kreditkartenBetrag: '',
      trinkgeld: '',
      trinkgeldMwst: '',
    };

    const request = createMockRequest(eigeneBelegData);
    const response = await POST(request);
    
    // Should not return validation error
    expect(response.status).not.toBe(400);
    
    if (response.status === 400) {
      const errorData = await response.json();
      console.log('Error details:', errorData);
      expect(errorData.details?.some((err: any) => 
        err.path?.includes('image') && err.message?.includes('Expected string, received null')
      )).toBe(false);
    } else {
      // Should succeed and return PDF data or success response
      expect(response.status).toBeOneOf([200, 201]);
    }
  });

  test('should handle Eigenbeleg request with undefined image', async () => {
    const eigeneBelegData = {
      datum: new Date('2025-07-07T00:00:00.000Z'),
      restaurantName: 'OSTERIA DEL PARCO',
      restaurantAnschrift: 'Anzinger St 1 85586 Poing',
      teilnehmer: 'Daniel Jordan, Sehrish Abhul',
      anlass: 'Mitarbeiterbesprechung',
      geschaeftlicherAnlass: 'Mitarbeiterbesprechung',
      gesamtbetrag: '37,00',
      gesamtbetragMwst: '7,03',
      gesamtbetragNetto: '29,97',
      zahlungsart: 'firma',
      bewirtungsart: 'mitarbeiter',
      istEigenbeleg: true,
      // This should also work
      image: undefined,
      attachments: [],
      kreditkartenBetrag: '',
      trinkgeld: '',
      trinkgeldMwst: '',
    };

    const request = createMockRequest(eigeneBelegData);
    const response = await POST(request);
    
    // Should not return validation error
    expect(response.status).not.toBe(400);
    
    if (response.status === 400) {
      const errorData = await response.json();
      expect(errorData.details?.some((err: any) => 
        err.path?.includes('image')
      )).toBe(false);
    } else {
      expect(response.status).toBeOneOf([200, 201]);
    }
  });

  test('should handle Eigenbeleg request without image field', async () => {
    const eigeneBelegData = {
      datum: new Date('2025-07-07T00:00:00.000Z'),
      restaurantName: 'OSTERIA DEL PARCO',
      restaurantAnschrift: 'Anzinger St 1 85586 Poing',
      teilnehmer: 'Daniel Jordan, Sehrish Abhul',
      anlass: 'Mitarbeiterbesprechung',
      geschaeftlicherAnlass: 'Mitarbeiterbesprechung',
      gesamtbetrag: '37,00',
      gesamtbetragMwst: '7,03',
      gesamtbetragNetto: '29,97',
      zahlungsart: 'firma',
      bewirtungsart: 'mitarbeiter',
      istEigenbeleg: true,
      // No image field at all
      attachments: [],
      kreditkartenBetrag: '',
      trinkgeld: '',
      trinkgeldMwst: '',
    };

    const request = createMockRequest(eigeneBelegData);
    const response = await POST(request);
    
    // Should not return validation error
    expect(response.status).not.toBe(400);
    expect(response.status).toBeOneOf([200, 201]);
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}
/**
 * @jest-environment node
 */

import * as fs from 'fs';
import * as path from 'path';

describe('POST /api/classify-receipt', () => {
  const mockOpenAICreate = jest.fn();
  
  // Mock modules before imports
  jest.doMock('openai', () => {
    return jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAICreate
        }
      }
    }));
  });

  jest.doMock('next/server', () => ({
    NextResponse: {
      json: (data: any, init?: ResponseInit) => ({
        json: async () => data,
        status: init?.status || 200
      })
    }
  }));

  jest.doMock('@/lib/rate-limit', () => ({
    checkRateLimit: jest.fn().mockResolvedValue(null),
    getIdentifier: jest.fn().mockReturnValue('test-user'),
    apiRatelimit: { general: {} }
  }));

  // Set env before importing the route
  const originalEnv = process.env;
  beforeAll(() => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-api-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAICreate.mockReset();
  });

  it('should successfully classify a receipt as "rechnung"', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response for invoice classification
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'rechnung',
            confidence: 0.95,
            reason: 'Dateiname enthält "Rechnung" und deutet auf Restaurant-Beleg hin',
            details: {
              rechnungProbability: 0.95,
              kundenbelegProbability: 0.05
            }
          })
        }
      }]
    });

    // Create mock request
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'Restaurant_Rechnung_2024.jpg',
        fileType: 'image/jpeg'
      })
    } as any;

    // Call the API
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      type: 'rechnung',
      confidence: 0.95,
      reason: 'Dateiname enthält "Rechnung" und deutet auf Restaurant-Beleg hin',
      details: {
        rechnungProbability: 0.95,
        kundenbelegProbability: 0.05
      }
    });

    // Verify OpenAI was called with correct parameters
    expect(mockOpenAICreate).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Du bist ein Experte für die Klassifizierung von Belegen')
        }),
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Restaurant_Rechnung_2024.jpg')
        })
      ]),
      response_format: { type: 'json_object' }
    });
  });

  it('should successfully classify a receipt as "kundenbeleg"', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response for credit card receipt
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'kundenbeleg',
            confidence: 0.88,
            reason: 'Dateiname deutet auf Kreditkarten-Transaktion hin',
            details: {
              rechnungProbability: 0.12,
              kundenbelegProbability: 0.88
            }
          })
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'VISA_Transaction_20240115.pdf',
        fileType: 'application/pdf'
      })
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('kundenbeleg');
    expect(data.confidence).toBeGreaterThan(0.8);
  });

  it('should handle unknown receipt types', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response for unknown type
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'unbekannt',
            confidence: 0.3,
            reason: 'Dateiname gibt keine eindeutigen Hinweise auf Belegtyp',
            details: {
              rechnungProbability: 0.4,
              kundenbelegProbability: 0.3
            }
          })
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'scan_001.jpg',
        fileType: 'image/jpeg'
      })
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.type).toBe('unbekannt');
    expect(data.confidence).toBeLessThan(0.5);
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI to throw error
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI API error'));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'test.jpg',
        fileType: 'image/jpeg'
      })
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Fehler bei der Klassifizierung' });
  });

  it('should handle invalid JSON response from OpenAI', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI to return invalid JSON
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: 'Invalid JSON'
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'test.jpg',
        fileType: 'image/jpeg'
      })
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Fehler bei der Klassifizierung' });
  });

  it('should handle empty or null OpenAI response', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI to return null content
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: null
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'test.jpg',
        fileType: 'image/jpeg'
      })
    } as any;

    const response = await POST(mockRequest);
    
    // Should return empty object without error since JSON.parse('{}') is valid
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({});
  });

  it('should handle different file types correctly', async () => {
    const { POST } = await import('./route');
    
    const fileTypes = [
      { fileName: 'receipt.pdf', fileType: 'application/pdf' },
      { fileName: 'scan.png', fileType: 'image/png' },
      { fileName: 'document.jpeg', fileType: 'image/jpeg' }
    ];

    for (const file of fileTypes) {
      mockOpenAICreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              type: 'rechnung',
              confidence: 0.8,
              reason: 'Test',
              details: {
                rechnungProbability: 0.8,
                kundenbelegProbability: 0.2
              }
            })
          }
        }]
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue(file)
      } as any;

      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
      
      // Verify the fileType was passed to OpenAI
      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(`Dateityp: ${file.fileType}`)
            })
          ])
        })
      );
    }
  });

  it('should classify credit card receipt PDF correctly', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response for credit card receipt
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'Kreditkartenbeleg',
            confidence: 0.95,
            reason: 'Das Dokument zeigt typische Merkmale eines Kreditkartenbelegs mit Transaktionsnummer und maskierter Kartennummer',
            details: {
              rechnungProbability: 0.05,
              kreditkartenbelegProbability: 0.95
            }
          })
        }
      }]
    });

    // Read the test credit card receipt PDF
    const pdfPath = path.join(__dirname, '../../../../test/08042025_kreditbeleg_Pareo.pdf');
    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          fileName: '08042025_kreditbeleg_Pareo.pdf',
          fileType: 'application/pdf',
          image: pdfBase64
        })
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('Kreditkartenbeleg');
      expect(data.confidence).toBeGreaterThan(0.9);
      
      // Verify that OpenAI was called with image content
      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image_url',
                  image_url: expect.objectContaining({
                    url: expect.stringContaining('data:application/pdf;base64,')
                  })
                })
              ])
            })
          ])
        })
      );
    }
  });

  it('should classify restaurant invoice PDF correctly', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response for restaurant invoice
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'Rechnung',
            confidence: 0.92,
            reason: 'Das Dokument zeigt eine detaillierte Restaurantrechnung mit Positionen, MwSt und Adresse',
            details: {
              rechnungProbability: 0.92,
              kreditkartenbelegProbability: 0.08
            }
          })
        }
      }]
    });

    // Read the test restaurant invoice PDF
    const pdfPath = path.join(__dirname, '../../../../test/04062025_Oehme Gastronomie GmbH_001.pdf');
    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
      
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          fileName: '04062025_Oehme Gastronomie GmbH_001.pdf',
          fileType: 'application/pdf',
          image: pdfBase64
        })
      } as any;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('Rechnung');
      expect(data.confidence).toBeGreaterThan(0.9);
    }
  });

  it('should use GPT-4o model when image is provided', async () => {
    const { POST } = await import('./route');
    
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'Rechnung',
            confidence: 0.9,
            reason: 'Test',
            details: { rechnungProbability: 0.9, kreditkartenbelegProbability: 0.1 }
          })
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        image: 'data:image/jpeg;base64,test'
      })
    } as any;

    await POST(mockRequest);

    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o'
      })
    );
  });

  it('should use GPT-3.5-turbo model when no image is provided', async () => {
    const { POST } = await import('./route');
    
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            type: 'Rechnung',
            confidence: 0.7,
            reason: 'Based on filename',
            details: { rechnungProbability: 0.7, kreditkartenbelegProbability: 0.3 }
          })
        }
      }]
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        fileName: 'rechnung_2025.pdf',
        fileType: 'application/pdf'
      })
    } as any;

    await POST(mockRequest);

    expect(mockOpenAICreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo'
      })
    );
  });
});
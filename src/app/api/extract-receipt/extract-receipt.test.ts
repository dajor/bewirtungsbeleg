/**
 * @jest-environment node
 */

describe('POST /api/extract-receipt', () => {
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

  it('should successfully extract receipt data from an image', async () => {
    // Import the route handler after mocks are set up
    const { POST } = await import('./route');
    
    // Mock OpenAI response
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Restaurant Zur Post',
            restaurantAnschrift: 'Hauptstraße 123, 10115 Berlin',
            gesamtbetrag: '89.50',
            mwst: '14.27',
            netto: '75.23',
            datum: '15.01.2024'
          })
        }
      }]
    });

    // Create mock request
    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    // Call the API
    const response = await POST(mockRequest);
    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      restaurantName: 'Restaurant Zur Post',
      restaurantAnschrift: 'Hauptstraße 123, 10115 Berlin',
      gesamtbetrag: '89,50', // Should be converted to German format
      mwst: '14.27',
      netto: '75.23',
      datum: '15.01.2024'
    });

    // Verify OpenAI was called
    expect(mockOpenAICreate).toHaveBeenCalled();
  });

  it('should return 400 when no image is provided', async () => {
    const { POST } = await import('./route');
    
    // Create request without image
    const mockFormData = {
      get: jest.fn().mockReturnValue(null)
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Kein Bild gefunden' });
  });

  it('should handle OpenAI API errors gracefully', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI to throw error
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI API error'));

    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Fehler bei der OCR-Verarbeitung' });
  });

  it('should handle invalid JSON response from OpenAI', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI to return invalid JSON
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    });

    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Fehler beim Parsen der Daten' });
  });

  it('should correctly convert decimal numbers to German format', async () => {
    const { POST } = await import('./route');
    
    // Mock OpenAI response with dot decimal separator
    mockOpenAICreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            restaurantName: 'Test Restaurant',
            gesamtbetrag: '123.45',
            mwst: '19.65',
            netto: '103.80',
            datum: '01.01.2024'
          })
        }
      }]
    });

    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gesamtbetrag).toBe('123,45'); // Should use comma as decimal separator
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

    const mockFormData = {
      get: jest.fn().mockReturnValue({
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: 1024,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      })
    };

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData)
    } as any;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({}); // Should return empty object
  });
});
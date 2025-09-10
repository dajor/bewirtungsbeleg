/**
 * Unit tests for Image Processing Service
 */

import { ImageProcessor } from './image-processor';

// Mock fetch globally
global.fetch = jest.fn();

describe('ImageProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any created blob URLs
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('fileToBase64', () => {
    it('should convert file to base64 string', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const mockBase64 = 'dGVzdCBjb250ZW50';
      
      // Mock FileReader
      const mockReadAsDataURL = jest.fn();
      const mockReader = {
        readAsDataURL: mockReadAsDataURL,
        onload: null as any,
        onerror: null as any,
        result: `data:image/jpeg;base64,${mockBase64}`
      };
      
      global.FileReader = jest.fn(() => mockReader) as any;
      
      // Trigger onload after readAsDataURL is called
      mockReadAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockReader.onload) {
            mockReader.onload({ target: { result: mockReader.result } });
          }
        }, 0);
      });

      const result = await ImageProcessor.fileToBase64(mockFile);
      
      expect(result).toBe(mockBase64);
      expect(mockReadAsDataURL).toHaveBeenCalledWith(mockFile);
    });

    it('should reject on FileReader error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Read error');
      
      const mockReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any,
      };
      
      global.FileReader = jest.fn(() => mockReader) as any;
      
      mockReader.readAsDataURL.mockImplementation(() => {
        setTimeout(() => {
          if (mockReader.onerror) {
            mockReader.onerror(mockError);
          }
        }, 0);
      });

      await expect(ImageProcessor.fileToBase64(mockFile)).rejects.toEqual(mockError);
    });
  });

  describe('base64ToBlobUrl', () => {
    it('should convert base64 to blob URL', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const expectedUrl = 'blob:mock-url';
      
      global.atob = jest.fn((str) => 'Hello World');
      
      const result = ImageProcessor.base64ToBlobUrl(base64, 'jpeg');
      
      expect(result).toBe(expectedUrl);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should use jpeg as default format', () => {
      const base64 = 'SGVsbG8=';
      global.atob = jest.fn(() => 'Hello');
      
      global.Blob = jest.fn((parts, options) => ({
        parts,
        type: options?.type
      })) as any;
      
      ImageProcessor.base64ToBlobUrl(base64);
      
      expect(global.Blob).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: 'image/jpeg' })
      );
    });
  });

  describe('processImage', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockBase64Input = 'input-base64';
    const mockBase64Output = 'output-base64';
    const mockBlobUrl = 'blob:mock-processed-url';

    beforeEach(() => {
      // Mock fileToBase64
      jest.spyOn(ImageProcessor, 'fileToBase64').mockResolvedValue(mockBase64Input);
      
      // Mock base64ToBlobUrl
      jest.spyOn(ImageProcessor, 'base64ToBlobUrl').mockReturnValue(mockBlobUrl);
    });

    it('should process image with rotation operation', async () => {
      const operations = [{ type: 'rotate' as const, angle: 90 }];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          image: mockBase64Output,
          format: 'jpeg',
          operations_applied: operations
        })
      });

      const result = await ImageProcessor.processImage(mockFile, operations);
      
      expect(result).toBe(mockBlobUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('image-processor'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: mockBase64Input,
            operations,
            format: 'jpeg'
          })
        })
      );
    });

    it('should handle API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      });

      await expect(
        ImageProcessor.processImage(mockFile, [{ type: 'rotate', angle: 45 }])
      ).rejects.toThrow('HTTP error! status: 400');
    });

    it('should handle API success:false response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid image format'
        })
      });

      await expect(
        ImageProcessor.processImage(mockFile, [{ type: 'deskew' }])
      ).rejects.toThrow('Invalid image format');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        ImageProcessor.processImage(mockFile, [{ type: 'rotate', angle: 90 }])
      ).rejects.toThrow('Network error');
    });
  });

  describe('rotateImage', () => {
    it('should call processImage with rotate operation', async () => {
      const mockFile = new File(['test'], 'test.jpg');
      const angle = 45;
      const expectedResult = 'blob:rotated-url';
      
      jest.spyOn(ImageProcessor, 'processImage').mockResolvedValue(expectedResult);

      const result = await ImageProcessor.rotateImage(mockFile, angle);
      
      expect(result).toBe(expectedResult);
      expect(ImageProcessor.processImage).toHaveBeenCalledWith(
        mockFile,
        [{ type: 'rotate', angle }]
      );
    });
  });

  describe('deskewImage', () => {
    it('should call processImage with deskew operation', async () => {
      const mockFile = new File(['test'], 'test.jpg');
      const expectedResult = 'blob:deskewed-url';
      
      jest.spyOn(ImageProcessor, 'processImage').mockResolvedValue(expectedResult);

      const result = await ImageProcessor.deskewImage(mockFile);
      
      expect(result).toBe(expectedResult);
      expect(ImageProcessor.processImage).toHaveBeenCalledWith(
        mockFile,
        [{ type: 'deskew' }]
      );
    });
  });

  describe('cropImage', () => {
    it('should call processImage with crop operation', async () => {
      const mockFile = new File(['test'], 'test.jpg');
      const cropParams = { x: 10, y: 20, width: 100, height: 150 };
      const expectedResult = 'blob:cropped-url';
      
      jest.spyOn(ImageProcessor, 'processImage').mockResolvedValue(expectedResult);

      const result = await ImageProcessor.cropImage(
        mockFile,
        cropParams.x,
        cropParams.y,
        cropParams.width,
        cropParams.height
      );
      
      expect(result).toBe(expectedResult);
      expect(ImageProcessor.processImage).toHaveBeenCalledWith(
        mockFile,
        [{ type: 'crop', ...cropParams }]
      );
    });
  });

  describe('applyOperations', () => {
    it('should call processImage with multiple operations', async () => {
      const mockFile = new File(['test'], 'test.jpg');
      const operations = [
        { type: 'deskew' as const },
        { type: 'rotate' as const, angle: 90 },
        { type: 'crop' as const, x: 0, y: 0, width: 200, height: 200 }
      ];
      const expectedResult = 'blob:processed-url';
      
      jest.spyOn(ImageProcessor, 'processImage').mockResolvedValue(expectedResult);

      const result = await ImageProcessor.applyOperations(mockFile, operations);
      
      expect(result).toBe(expectedResult);
      expect(ImageProcessor.processImage).toHaveBeenCalledWith(mockFile, operations);
    });
  });
});
/**
 * Mock for @aws-sdk/client-s3
 * Used in unit tests to simulate DigitalOcean Spaces operations
 */

// Simple mock function that returns a resolved promise
const mockFn = (returnValue?: any) => {
  return () => Promise.resolve(returnValue || {});
};

export class S3Client {
  constructor(config: any) {
    // Mock constructor
  }
}

export class PutObjectCommand {
  input: any;

  constructor(input: any) {
    this.input = input;
  }
}

export class GetObjectCommand {
  input: any;

  constructor(input: any) {
    this.input = input;
  }
}

export class DeleteObjectCommand {
  input: any;

  constructor(input: any) {
    this.input = input;
  }
}

// Mock send function for testing (without using vi or jest to avoid TypeScript errors)
export const mockSend = mockFn({});

// Export mock implementation
export const mockS3Client = {
  send: mockSend,
};

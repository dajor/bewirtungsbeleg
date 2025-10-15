/**
 * Mock for @aws-sdk/client-s3
 * Used in unit tests to simulate DigitalOcean Spaces operations
 */

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

// Mock send function for testing (without using vi to avoid TypeScript errors)
export const mockSend = jest.fn ? jest.fn() : (() => Promise.resolve({}));

// Export mock implementation
export const mockS3Client = {
  send: mockSend,
};

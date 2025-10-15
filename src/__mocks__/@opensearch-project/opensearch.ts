/**
 * Mock for @opensearch-project/opensearch
 * Used in unit tests to simulate OpenSearch operations
 */

// Mock implementation without using vi to avoid TypeScript errors
export class Client {
  indices: any;
  index: any;
  search: any;
  delete: any;

  constructor(config: any) {
    this.indices = {
      exists: jest.fn ? jest.fn() : (() => Promise.resolve({ body: true })),
      create: jest.fn ? jest.fn() : (() => Promise.resolve({ acknowledged: true })),
      delete: jest.fn ? jest.fn() : (() => Promise.resolve({ acknowledged: true })),
    };

    this.index = jest.fn ? jest.fn() : (() => Promise.resolve({ result: 'created' }));
    this.search = jest.fn ? jest.fn() : (() => Promise.resolve({ body: { hits: { hits: [], total: 0 } } }));
    this.delete = jest.fn ? jest.fn() : (() => Promise.resolve({ result: 'deleted' }));
  }
}

// Export mock client for tests
export const mockOpenSearchClient = {
  indices: {
    exists: jest.fn ? jest.fn() : (() => Promise.resolve({ body: true })),
    create: jest.fn ? jest.fn() : (() => Promise.resolve({ acknowledged: true })),
    delete: jest.fn ? jest.fn() : (() => Promise.resolve({ acknowledged: true })),
  },
  index: jest.fn ? jest.fn() : (() => Promise.resolve({ result: 'created' })),
  search: jest.fn ? jest.fn() : (() => Promise.resolve({ body: { hits: { hits: [], total: 0 } } })),
  delete: jest.fn ? jest.fn() : (() => Promise.resolve({ result: 'deleted' })),
};

/**
 * Mock for @opensearch-project/opensearch
 * Used in unit tests to simulate OpenSearch operations
 */

export class Client {
  indices: any;
  index: any;
  search: any;
  delete: any;

  constructor(config: any) {
    this.indices = {
      exists: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    this.index = vi.fn();
    this.search = vi.fn();
    this.delete = vi.fn();
  }
}

// Export mock client for tests
export const mockOpenSearchClient = {
  indices: {
    exists: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  index: vi.fn(),
  search: vi.fn(),
  delete: vi.fn(),
};

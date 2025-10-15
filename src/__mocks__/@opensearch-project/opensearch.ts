/**
 * Mock for @opensearch-project/opensearch
 * Used in unit tests to simulate OpenSearch operations
 */

// Simple mock function that returns a resolved promise with appropriate default values
const mockFn = (returnValue?: any) => {
  return () => Promise.resolve(returnValue || {});
};

export class Client {
  indices: any;
  index: any;
  search: any;
  delete: any;

  constructor(config: any) {
    this.indices = {
      exists: mockFn({ body: true }),
      create: mockFn({ acknowledged: true }),
      delete: mockFn({ acknowledged: true }),
    };

    this.index = mockFn({ result: 'created' });
    this.search = mockFn({ body: { hits: { hits: [], total: 0 } } });
    this.delete = mockFn({ result: 'deleted' });
  }
}

// Export mock client for tests
export const mockOpenSearchClient = {
  indices: {
    exists: mockFn({ body: true }),
    create: mockFn({ acknowledged: true }),
    delete: mockFn({ acknowledged: true }),
  },
  index: mockFn({ result: 'created' }),
  search: mockFn({ body: { hits: { hits: [], total: 0 } } }),
  delete: mockFn({ result: 'deleted' }),
};

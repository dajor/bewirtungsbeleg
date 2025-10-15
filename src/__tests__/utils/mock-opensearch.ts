/**
 * Mock OpenSearch utilities for testing
 */

import { sampleDocument1, sampleDocument2 } from '../fixtures/sample-documents';

export const mockIndexName = 'documents-user-test-example-com';

export const mockIndexExistsResponse = {
  body: true,
};

export const mockIndexNotExistsResponse = {
  body: false,
};

export const mockCreateIndexResponse = {
  acknowledged: true,
  shards_acknowledged: true,
  index: mockIndexName,
};

export const mockIndexDocumentResponse = {
  _index: mockIndexName,
  _id: 'doc-user-1-1710518400000',
  _version: 1,
  result: 'created',
  _shards: {
    total: 2,
    successful: 1,
    failed: 0,
  },
};

export const mockSearchResponse = {
  hits: {
    total: {
      value: 2,
      relation: 'eq',
    },
    max_score: 1.0,
    hits: [
      {
        _index: mockIndexName,
        _id: sampleDocument1.id,
        _score: 1.0,
        _source: sampleDocument1,
      },
      {
        _index: mockIndexName,
        _id: sampleDocument2.id,
        _score: 0.8,
        _source: sampleDocument2,
      },
    ],
  },
};

export const mockEmptySearchResponse = {
  hits: {
    total: {
      value: 0,
      relation: 'eq',
    },
    max_score: null,
    hits: [],
  },
};

export const mockDeleteDocumentResponse = {
  _index: mockIndexName,
  _id: 'doc-user-1-1710518400000',
  _version: 2,
  result: 'deleted',
  _shards: {
    total: 2,
    successful: 1,
    failed: 0,
  },
};

// Simple mock function that returns a resolved promise with appropriate default values
const mockFn = (returnValue?: any) => {
  return () => Promise.resolve(returnValue || {});
};

/**
 * Create mock OpenSearch client with default behavior
 */
export function createMockOpenSearchClient(options: {
  indexExists?: boolean;
  searchResults?: any;
  indexSuccess?: boolean;
} = {}) {
  const {
    indexExists = true,
    searchResults = mockSearchResponse,
    indexSuccess = true,
  } = options;

  return {
    indices: {
      exists: mockFn(indexExists ? mockIndexExistsResponse : mockIndexNotExistsResponse),
      create: mockFn(mockCreateIndexResponse),
      delete: mockFn({ acknowledged: true }),
    },
    index: mockFn(indexSuccess ? mockIndexDocumentResponse : { result: 'error' }),
    search: mockFn(searchResults),
    delete: mockFn(mockDeleteDocumentResponse),
  };
}

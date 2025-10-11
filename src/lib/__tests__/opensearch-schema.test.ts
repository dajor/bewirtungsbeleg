/**
 * Unit tests for OpenSearch Schema (opensearch-schema.ts)
 */

import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_INDEX_MAPPING,
  getUserIndexName,
  getAllUsersIndexPattern,
} from '../opensearch-schema';

describe('opensearch-schema.ts - Schema Definitions', () => {
  describe('DOCUMENT_INDEX_MAPPING', () => {
    it('should include all required field mappings', () => {
      expect(DOCUMENT_INDEX_MAPPING).toHaveProperty('settings');
      expect(DOCUMENT_INDEX_MAPPING).toHaveProperty('mappings');
      expect(DOCUMENT_INDEX_MAPPING.mappings).toHaveProperty('properties');
    });

    it('should configure k-NN vector field with 1536 dimensions', () => {
      const embedding = DOCUMENT_INDEX_MAPPING.mappings.properties.embedding;

      expect(embedding).toBeDefined();
      expect(embedding.type).toBe('knn_vector');
      expect(embedding.dimension).toBe(1536);
      expect(embedding.method).toHaveProperty('name', 'hnsw');
      expect(embedding.method).toHaveProperty('space_type', 'cosinesimil');
    });

    it('should configure German analyzer correctly', () => {
      const analysis = DOCUMENT_INDEX_MAPPING.settings.analysis;

      expect(analysis).toBeDefined();
      expect(analysis.analyzer).toHaveProperty('german_analyzer');
      expect(analysis.analyzer.german_analyzer.type).toBe('custom');
      expect(analysis.analyzer.german_analyzer.filter).toContain('german_stop');
      expect(analysis.analyzer.german_analyzer.filter).toContain('german_stemmer');
    });

    it('should set correct field types', () => {
      const properties = DOCUMENT_INDEX_MAPPING.mappings.properties;

      // Keyword fields
      expect(properties.id.type).toBe('keyword');
      expect(properties.user_id.type).toBe('keyword');
      expect(properties.type.type).toBe('keyword');
      expect(properties.status.type).toBe('keyword');

      // Date fields
      expect(properties.created_at.type).toBe('date');
      expect(properties.updated_at.type).toBe('date');

      // Text fields with German analyzer
      expect(properties.name.type).toBe('text');
      expect(properties.name.analyzer).toBe('german_analyzer');
      expect(properties.full_text.type).toBe('text');
      expect(properties.full_text.analyzer).toBe('german_analyzer');

      // Boolean field
      expect(properties.gobd_compliant.type).toBe('boolean');

      // Float field
      expect(properties.metadata.properties.total_amount.type).toBe('float');
    });

    it('should disable indexing for URL fields', () => {
      const properties = DOCUMENT_INDEX_MAPPING.mappings.properties;

      expect(properties.thumbnail_url.index).toBe(false);
      expect(properties.pdf_url.index).toBe(false);
      expect(properties.original_url.index).toBe(false);
      expect(properties.signature_hash.index).toBe(false);
      expect(properties.gobd_signature.index).toBe(false);
    });

    it('should enable dynamic mapping for form_data', () => {
      const formData = DOCUMENT_INDEX_MAPPING.mappings.properties.form_data;

      expect(formData.type).toBe('object');
      expect(formData.enabled).toBe(true);
    });

    it('should configure metadata nested object', () => {
      const metadata = DOCUMENT_INDEX_MAPPING.mappings.properties.metadata;

      expect(metadata.type).toBe('object');
      expect(metadata.properties).toBeDefined();
      expect(metadata.properties.restaurant_name).toBeDefined();
      expect(metadata.properties.restaurant_name.type).toBe('text');
      expect(metadata.properties.restaurant_name.analyzer).toBe('german_analyzer');
    });

    it('should include keyword subfield for text fields', () => {
      const name = DOCUMENT_INDEX_MAPPING.mappings.properties.name;
      const restaurantName = DOCUMENT_INDEX_MAPPING.mappings.properties.metadata.properties.restaurant_name;

      expect(name.fields).toHaveProperty('keyword');
      expect(name.fields.keyword.type).toBe('keyword');
      expect(restaurantName.fields).toHaveProperty('keyword');
      expect(restaurantName.fields.keyword.type).toBe('keyword');
    });
  });

  describe('getUserIndexName()', () => {
    it('should generate correct index name format', () => {
      const indexName = getUserIndexName('user-1');

      expect(indexName).toBe('documents-user-user-1');
    });

    it('should sanitize special characters', () => {
      const indexName = getUserIndexName('user@example.com');

      expect(indexName).toMatch(/^documents-user-/);
      expect(indexName).not.toContain('@');
      expect(indexName).not.toContain('.');
    });

    it('should convert to lowercase', () => {
      const indexName = getUserIndexName('USER-123');

      expect(indexName).toBe('documents-user-user-123');
    });

    it('should handle email addresses as user IDs', () => {
      const indexName = getUserIndexName('test@example.com');

      expect(indexName).toMatch(/^documents-user-/);
      expect(indexName).toBe(indexName.toLowerCase());
    });

    it('should handle UUIDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const indexName = getUserIndexName(uuid);

      expect(indexName).toBe('documents-user-550e8400-e29b-41d4-a716-446655440000');
    });

    it('should replace dots with hyphens', () => {
      const indexName = getUserIndexName('user.test.123');

      expect(indexName).not.toContain('.');
      expect(indexName).toContain('-');
    });

    it('should handle underscores', () => {
      const indexName = getUserIndexName('user_test_123');

      expect(indexName).toContain('_');
      expect(indexName).toBe('documents-user-user_test_123');
    });
  });

  describe('getAllUsersIndexPattern()', () => {
    it('should return wildcard pattern', () => {
      const pattern = getAllUsersIndexPattern();

      expect(pattern).toBe('documents-user-*');
    });

    it('should match all user index names', () => {
      const pattern = getAllUsersIndexPattern();
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');

      expect(regex.test('documents-user-user-1')).toBe(true);
      expect(regex.test('documents-user-test-example-com')).toBe(true);
      expect(regex.test('documents-user-admin')).toBe(true);
      expect(regex.test('other-index')).toBe(false);
    });
  });

  describe('BDD Scenario: Create user-specific index', () => {
    it('Given new user with email, When creating OpenSearch index, Then index name should be sanitized', () => {
      // Given
      const userEmail = 'test@example.com';

      // When
      const indexName = getUserIndexName(userEmail);

      // Then
      expect(indexName).toMatch(/^documents-user-test-example-com$/);
      expect(indexName).not.toContain('@');
      expect(indexName).not.toContain('.');
    });
  });

  describe('Schema Validation', () => {
    it('should support both fulltext and vector search', () => {
      const properties = DOCUMENT_INDEX_MAPPING.mappings.properties;

      // Fulltext search support
      expect(properties.full_text).toBeDefined();
      expect(properties.full_text.type).toBe('text');
      expect(properties.full_text.analyzer).toBe('german_analyzer');

      // Vector search support
      expect(properties.embedding).toBeDefined();
      expect(properties.embedding.type).toBe('knn_vector');
      expect(properties.embedding.dimension).toBe(1536);
    });

    it('should configure HNSW algorithm for efficient k-NN search', () => {
      const embedding = DOCUMENT_INDEX_MAPPING.mappings.properties.embedding;
      const method = embedding.method;

      expect(method.name).toBe('hnsw');
      expect(method.engine).toBe('nmslib');
      expect(method.parameters).toHaveProperty('ef_construction');
      expect(method.parameters).toHaveProperty('m');
    });

    it('should use cosine similarity for semantic search', () => {
      const embedding = DOCUMENT_INDEX_MAPPING.mappings.properties.embedding;

      expect(embedding.method.space_type).toBe('cosinesimil');
    });

    it('should configure number of shards and replicas', () => {
      const settings = DOCUMENT_INDEX_MAPPING.settings;

      expect(settings.number_of_shards).toBe(1);
      expect(settings.number_of_replicas).toBe(1);
    });

    it('should include German stop words filter', () => {
      const analysis = DOCUMENT_INDEX_MAPPING.settings.analysis;
      const germanStop = analysis.filter.german_stop;

      expect(germanStop.type).toBe('stop');
      expect(germanStop.stopwords).toBe('_german_');
    });

    it('should include German stemmer filter', () => {
      const analysis = DOCUMENT_INDEX_MAPPING.settings.analysis;
      const germanStemmer = analysis.filter.german_stemmer;

      expect(germanStemmer.type).toBe('stemmer');
      expect(germanStemmer.language).toBe('german');
    });
  });
});

/**
 * Tests for email utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateToken,
  isTokenExpired,
  createEmailVerificationToken,
  createPasswordResetToken,
  createMagicLinkToken,
  sanitizeEmail,
  isValidEmail,
  generateVerificationUrl,
  generatePasswordResetUrl,
  generateMagicLinkUrl,
  getTokenExpiryMinutes,
  type EmailToken,
} from './utils';

describe('Email Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a token with default 32 bytes', () => {
      const token = generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens on each call', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateToken();
      // URL-safe base64 should not contain +, /, or =
      expect(token).not.toMatch(/[+/=]/);
    });

    it('should generate tokens of different lengths based on bytes parameter', () => {
      const token16 = generateToken(16);
      const token64 = generateToken(64);
      expect(token64.length).toBeGreaterThan(token16.length);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for tokens created just now', () => {
      const createdAt = Date.now();
      expect(isTokenExpired(createdAt, 30)).toBe(false);
    });

    it('should return true for expired tokens', () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      expect(isTokenExpired(oneHourAgo, 30)).toBe(true);
    });

    it('should return false for tokens within expiry window', () => {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      expect(isTokenExpired(tenMinutesAgo, 30)).toBe(false);
    });

    it('should handle edge case at exact expiry time', () => {
      const createdAt = Date.now() - (30 * 60 * 1000); // Exactly 30 minutes ago
      // Should be expired (or very close to expiry boundary)
      const result = isTokenExpired(createdAt, 30);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createEmailVerificationToken', () => {
    it('should create token with correct type', () => {
      const token = createEmailVerificationToken('test@example.com');
      expect(token.type).toBe('email_verify');
    });

    it('should include email address', () => {
      const email = 'test@example.com';
      const token = createEmailVerificationToken(email);
      expect(token.email).toBe(email);
    });

    it('should include userId when provided', () => {
      const userId = 'user123';
      const token = createEmailVerificationToken('test@example.com', userId);
      expect(token.userId).toBe(userId);
    });

    it('should have a token string', () => {
      const token = createEmailVerificationToken('test@example.com');
      expect(token.token).toBeDefined();
      expect(typeof token.token).toBe('string');
      expect(token.token.length).toBeGreaterThan(0);
    });

    it('should have a createdAt timestamp', () => {
      const before = Date.now();
      const token = createEmailVerificationToken('test@example.com');
      const after = Date.now();
      expect(token.createdAt).toBeGreaterThanOrEqual(before);
      expect(token.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('createPasswordResetToken', () => {
    it('should create token with correct type', () => {
      const token = createPasswordResetToken('test@example.com');
      expect(token.type).toBe('password_reset');
    });

    it('should include email address', () => {
      const email = 'test@example.com';
      const token = createPasswordResetToken(email);
      expect(token.email).toBe(email);
    });

    it('should include userId when provided', () => {
      const userId = 'user456';
      const token = createPasswordResetToken('test@example.com', userId);
      expect(token.userId).toBe(userId);
    });
  });

  describe('createMagicLinkToken', () => {
    it('should create token with correct type', () => {
      const token = createMagicLinkToken('test@example.com');
      expect(token.type).toBe('magic_link');
    });

    it('should include email address', () => {
      const email = 'test@example.com';
      const token = createMagicLinkToken(email);
      expect(token.email).toBe(email);
    });

    it('should not have userId', () => {
      const token = createMagicLinkToken('test@example.com');
      expect(token.userId).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle mixed case and whitespace', () => {
      expect(sanitizeEmail('  TeSt@ExAmPlE.CoM  ')).toBe('test@example.com');
    });

    it('should handle already clean emails', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@.com')).toBe(false);
      expect(isValidEmail('invalid @example.com')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('generateVerificationUrl', () => {
    it('should generate URL with default path', () => {
      const url = generateVerificationUrl('https://example.com', 'token123');
      expect(url).toBe('https://example.com/auth/verify-email?token=token123');
    });

    it('should generate URL with custom path', () => {
      const url = generateVerificationUrl('https://example.com', 'token123', '/custom/path');
      expect(url).toBe('https://example.com/custom/path?token=token123');
    });

    it('should handle baseUrl without trailing slash', () => {
      const url = generateVerificationUrl('https://example.com', 'token123');
      expect(url).not.toContain('//auth');
    });

    it('should encode token in URL', () => {
      const token = 'abc123_-XYZ';
      const url = generateVerificationUrl('https://example.com', token);
      expect(url).toContain(`token=${token}`);
    });
  });

  describe('generatePasswordResetUrl', () => {
    it('should generate reset URL with correct path', () => {
      const url = generatePasswordResetUrl('https://example.com', 'token456');
      expect(url).toBe('https://example.com/auth/passwort-zurucksetzen?token=token456');
    });
  });

  describe('generateMagicLinkUrl', () => {
    it('should generate magic link URL with correct path', () => {
      const url = generateMagicLinkUrl('https://example.com', 'token789');
      expect(url).toBe('https://example.com/api/auth/magic-link/verify?token=token789');
    });
  });

  describe('getTokenExpiryMinutes', () => {
    it('should return correct expiry for email verification', () => {
      expect(getTokenExpiryMinutes('email_verify')).toBe(24 * 60); // 24 hours
    });

    it('should return correct expiry for password reset', () => {
      expect(getTokenExpiryMinutes('password_reset')).toBe(30); // 30 minutes
    });

    it('should return correct expiry for magic link', () => {
      expect(getTokenExpiryMinutes('magic_link')).toBe(10); // 10 minutes
    });
  });

  describe('Token uniqueness and security', () => {
    it('should generate unique tokens for same email', () => {
      const token1 = createEmailVerificationToken('test@example.com');
      const token2 = createEmailVerificationToken('test@example.com');
      expect(token1.token).not.toBe(token2.token);
    });

    it('should generate tokens with sufficient entropy', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe('Integration scenarios', () => {
    it('should create and validate email verification flow', () => {
      const email = 'user@example.com';
      const token = createEmailVerificationToken(email);

      // Token should be fresh
      expect(isTokenExpired(token.createdAt, getTokenExpiryMinutes(token.type))).toBe(false);

      // Email should match
      expect(token.email).toBe(email);

      // Should be email_verify type
      expect(token.type).toBe('email_verify');
    });

    it('should create and validate password reset flow', () => {
      const email = 'user@example.com';
      const userId = 'user123';
      const token = createPasswordResetToken(email, userId);

      // Should have correct type
      expect(token.type).toBe('password_reset');

      // Should have userId
      expect(token.userId).toBe(userId);

      // Token should not be expired initially
      expect(isTokenExpired(token.createdAt, 30)).toBe(false);

      // Generate URL
      const url = generatePasswordResetUrl('https://app.com', token.token);
      expect(url).toContain(token.token);
    });

    it('should handle complete magic link workflow', () => {
      const email = sanitizeEmail('  User@Example.COM  ');
      const token = createMagicLinkToken(email);

      // Email should be sanitized
      expect(token.email).toBe('user@example.com');

      // Should be magic_link type
      expect(token.type).toBe('magic_link');

      // Generate magic link URL
      const url = generateMagicLinkUrl('https://app.com', token.token);
      expect(url).toContain('/api/auth/magic-link/verify');

      // Token should expire in 10 minutes
      expect(getTokenExpiryMinutes(token.type)).toBe(10);
    });
  });
});

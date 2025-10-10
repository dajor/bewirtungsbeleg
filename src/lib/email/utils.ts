/**
 * Email utilities for token generation, validation, and formatting
 */

import { randomBytes } from 'crypto';

export interface EmailToken {
  token: string;
  email: string;
  userId?: string;
  createdAt: number;
  type: 'email_verify' | 'password_reset' | 'magic_link';
}

/**
 * Generate a cryptographically secure random token
 * @param bytes - Number of random bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Check if a token has expired
 * @param createdAt - Timestamp when token was created
 * @param expiryMinutes - Expiry time in minutes
 * @returns true if expired
 */
export function isTokenExpired(createdAt: number, expiryMinutes: number): boolean {
  const now = Date.now();
  const expiryTime = createdAt + (expiryMinutes * 60 * 1000);
  return now > expiryTime;
}

/**
 * Create an email verification token
 * @param email - User's email address
 * @param userId - Optional user ID
 * @returns EmailToken object
 */
export function createEmailVerificationToken(email: string, userId?: string): EmailToken {
  return {
    token: generateToken(),
    email,
    userId,
    createdAt: Date.now(),
    type: 'email_verify',
  };
}

/**
 * Create a password reset token
 * @param email - User's email address
 * @param userId - Optional user ID
 * @returns EmailToken object
 */
export function createPasswordResetToken(email: string, userId?: string): EmailToken {
  return {
    token: generateToken(),
    email,
    userId,
    createdAt: Date.now(),
    type: 'password_reset',
  };
}

/**
 * Create a magic link token
 * @param email - User's email address
 * @returns EmailToken object
 */
export function createMagicLinkToken(email: string): EmailToken {
  return {
    token: generateToken(),
    email,
    createdAt: Date.now(),
    type: 'magic_link',
  };
}

/**
 * Sanitize email address (lowercase and trim)
 * @param email - Email address
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate email format
 * @param email - Email address
 * @returns true if valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate verification URL
 * @param baseUrl - Base URL of the application
 * @param token - Verification token
 * @param path - Path to verification endpoint (default: /auth/verify-email)
 * @returns Full verification URL
 */
export function generateVerificationUrl(
  baseUrl: string,
  token: string,
  path: string = '/auth/verify-email'
): string {
  return `${baseUrl}${path}?token=${token}`;
}

/**
 * Generate password reset URL
 * @param baseUrl - Base URL of the application
 * @param token - Reset token
 * @returns Full reset URL
 */
export function generatePasswordResetUrl(baseUrl: string, token: string): string {
  return generateVerificationUrl(baseUrl, token, '/auth/reset-password');
}

/**
 * Generate magic link URL
 * @param baseUrl - Base URL of the application
 * @param token - Magic link token
 * @returns Full magic link URL
 */
export function generateMagicLinkUrl(baseUrl: string, token: string): string {
  return generateVerificationUrl(baseUrl, token, '/api/auth/magic-link/verify');
}

/**
 * Get token expiry time in minutes based on type
 * @param type - Token type
 * @returns Expiry time in minutes
 */
export function getTokenExpiryMinutes(type: EmailToken['type']): number {
  switch (type) {
    case 'email_verify':
      return 24 * 60; // 24 hours
    case 'password_reset':
      return 30; // 30 minutes
    case 'magic_link':
      return 10; // 10 minutes
    default:
      return 30;
  }
}

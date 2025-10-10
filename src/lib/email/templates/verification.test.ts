/**
 * Tests for email verification template
 * @jest-environment node
 */

import { describe, it, expect } from 'vitest';
import { generateEmailVerificationEmail } from './verification';

describe('generateEmailVerificationEmail', () => {
  it('should generate HTML email with all required elements', () => {
    const html = generateEmailVerificationEmail(
      'Max Mustermann',
      'http://localhost:3000/auth/setup-password?token=abc123'
    );

    expect(html).toContain('<!DOCTYPE html');
    expect(html).toContain('Max Mustermann');
    expect(html).toContain('http://localhost:3000/auth/setup-password?token=abc123');
    expect(html).toContain('Willkommen bei DocBits!');
    expect(html).toContain('E-Mail bestätigen und Passwort erstellen');
  });

  it('should include verification URL in button', () => {
    const verificationUrl = 'http://localhost:3000/auth/setup-password?token=xyz789';
    const html = generateEmailVerificationEmail('Test User', verificationUrl);

    expect(html).toContain(`href="${verificationUrl}"`);
    expect(html).toContain('E-Mail bestätigen und Passwort erstellen');
  });

  it('should include expiry time', () => {
    const html = generateEmailVerificationEmail(
      'Test User',
      'http://localhost:3000/verify',
      24
    );

    expect(html).toContain('24 Stunden');
  });

  it('should use custom expiry time', () => {
    const html = generateEmailVerificationEmail(
      'Test User',
      'http://localhost:3000/verify',
      48
    );

    expect(html).toContain('48 Stunden');
  });

  it('should include fallback link', () => {
    const verificationUrl = 'http://localhost:3000/auth/setup-password?token=fallback';
    const html = generateEmailVerificationEmail('Test User', verificationUrl);

    // Should include the URL in both button href and as plain text
    expect(html).toContain(`href="${verificationUrl}"`);
    expect(html).toContain(verificationUrl);
  });

  it('should handle names with special characters', () => {
    const html = generateEmailVerificationEmail(
      'François Müller-Schmidt',
      'http://localhost:3000/verify'
    );

    expect(html).toContain('François Müller-Schmidt');
  });

  it('should include security information', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('Was passiert als nächstes');
    expect(html).toContain('Passwort erstellen');
  });

  it('should include proper email title', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('<title>E-Mail-Adresse bestätigen - DocBits</title>');
  });

  it('should include preheader text', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('Bestätigen Sie Ihre E-Mail-Adresse');
  });

  it('should be valid HTML', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
  });

  it('should include responsive meta tags', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });

  it('should include DocBits branding', () => {
    const html = generateEmailVerificationEmail('Test User', 'http://localhost:3000/verify');

    expect(html).toContain('DocBits');
    expect(html).toContain('FELLOWPRO AG');
  });
});

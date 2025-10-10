/**
 * Tests for email templates
 */

import { describe, it, expect } from 'vitest';
import {
  generateBaseEmail,
  generateButton,
  generateHeading,
  generateParagraph,
  generateDivider,
  generateInfoBox,
} from './base';
import { generateWelcomeEmail, generateVerificationReminderEmail } from './welcome';
import { generatePasswordResetEmail, generatePasswordChangedEmail } from './password-reset';
import { generateMagicLinkEmail } from './magic-link';

describe('Email Templates', () => {
  describe('Base Template Components', () => {
    describe('generateBaseEmail', () => {
      it('should generate complete HTML email structure', () => {
        const html = generateBaseEmail({
          title: 'Test Email',
          content: '<p>Test content</p>',
        });

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="de"');
        expect(html).toContain('<title>Test Email</title>');
        expect(html).toContain('<p>Test content</p>');
        expect(html).toContain('FELLOWPRO AG');
        expect(html).toContain('DocBits Software');
      });

      it('should include DocBits logo', () => {
        const html = generateBaseEmail({
          title: 'Test',
          content: 'Content',
        });

        expect(html).toContain('DocBits');
        expect(html).toContain('BEWIRTUNGSBELEG');
      });

      it('should include preheader when provided', () => {
        const html = generateBaseEmail({
          title: 'Test',
          preheader: 'This is the preheader text',
          content: 'Content',
        });

        expect(html).toContain('This is the preheader text');
        expect(html).toContain('display: none');
      });

      it('should not include preheader div when not provided', () => {
        const html = generateBaseEmail({
          title: 'Test',
          content: 'Content',
        });

        const preheaderRegex = /<div[^>]*display:\s*none[^>]*>/;
        expect(html.match(preheaderRegex)).toBeNull();
      });

      it('should include footer links', () => {
        const html = generateBaseEmail({
          title: 'Test',
          content: 'Content',
        });

        expect(html).toContain('https://bewirtungsbeleg.docbits.com/privacy');
        expect(html).toContain('https://bewirtungsbeleg.docbits.com/terms');
        expect(html).toContain('mailto:support@docbits.com');
      });

      it('should have responsive styles', () => {
        const html = generateBaseEmail({
          title: 'Test',
          content: 'Content',
        });

        expect(html).toContain('@media only screen and (max-width: 640px)');
        expect(html).toContain('.mobile-padding');
      });
    });

    describe('generateButton', () => {
      it('should generate button with text and URL', () => {
        const button = generateButton('Click Me', 'https://example.com');

        expect(button).toContain('Click Me');
        expect(button).toContain('href="https://example.com"');
        expect(button).toContain('<table');
        expect(button).toContain('background-color: #228BE6');
      });

      it('should have proper styling', () => {
        const button = generateButton('Test', 'https://test.com');

        expect(button).toContain('border-radius: 6px');
        expect(button).toContain('color: #ffffff');
        expect(button).toContain('font-weight: 500');
      });
    });

    describe('generateHeading', () => {
      it('should generate level 1 heading by default', () => {
        const heading = generateHeading('Test Heading');

        expect(heading).toContain('<h1');
        expect(heading).toContain('</h1>');
        expect(heading).toContain('Test Heading');
        expect(heading).toContain('font-size: 28px');
      });

      it('should generate level 2 heading when specified', () => {
        const heading = generateHeading('Test Heading', 2);

        expect(heading).toContain('<h2');
        expect(heading).toContain('</h2>');
        expect(heading).toContain('font-size: 22px');
      });

      it('should have proper styling', () => {
        const heading = generateHeading('Test');

        expect(heading).toContain('font-weight: 600');
        expect(heading).toContain('color: #212529');
      });
    });

    describe('generateParagraph', () => {
      it('should generate paragraph with text', () => {
        const paragraph = generateParagraph('This is a test paragraph.');

        expect(paragraph).toContain('<p');
        expect(paragraph).toContain('</p>');
        expect(paragraph).toContain('This is a test paragraph.');
      });

      it('should have proper styling', () => {
        const paragraph = generateParagraph('Test');

        expect(paragraph).toContain('font-size: 16px');
        expect(paragraph).toContain('line-height: 24px');
      });
    });

    describe('generateDivider', () => {
      it('should generate divider element', () => {
        const divider = generateDivider();

        expect(divider).toContain('<div');
        expect(divider).toContain('border-top:');
        expect(divider).toContain('margin: 30px 0');
      });
    });

    describe('generateInfoBox', () => {
      it('should generate info box with text', () => {
        const infoBox = generateInfoBox('This is important information.');

        expect(infoBox).toContain('This is important information.');
        expect(infoBox).toContain('<table');
        expect(infoBox).toContain('border-left: 3px solid #228BE6');
      });
    });
  });

  describe('Welcome Email Template', () => {
    describe('generateWelcomeEmail', () => {
      it('should generate welcome email with user name', () => {
        const html = generateWelcomeEmail({
          userName: 'John Doe',
          verificationUrl: 'https://example.com/verify?token=abc123',
        });

        expect(html).toContain('Hallo John Doe');
        expect(html).toContain('Willkommen bei DocBits');
        expect(html).toContain('E-Mail-Adresse bestätigen');
        expect(html).toContain('https://example.com/verify?token=abc123');
      });

      it('should generate welcome email without user name', () => {
        const html = generateWelcomeEmail({
          verificationUrl: 'https://example.com/verify?token=abc123',
        });

        expect(html).toContain('Hallo!');
        expect(html).not.toContain('Hallo undefined');
      });

      it('should include expiry time', () => {
        const html = generateWelcomeEmail({
          verificationUrl: 'https://example.com/verify',
          expiryHours: 48,
        });

        expect(html).toContain('48 Stunden');
      });

      it('should have default 24 hour expiry', () => {
        const html = generateWelcomeEmail({
          verificationUrl: 'https://example.com/verify',
        });

        expect(html).toContain('24 Stunden');
      });

      it('should include verification button', () => {
        const html = generateWelcomeEmail({
          verificationUrl: 'https://example.com/verify',
        });

        expect(html).toContain('E-Mail-Adresse bestätigen');
        expect(html).toContain('href="https://example.com/verify"');
      });

      it('should include link as fallback', () => {
        const html = generateWelcomeEmail({
          verificationUrl: 'https://example.com/verify?token=long_token_string',
        });

        expect(html).toContain('Falls der Button nicht funktioniert');
        expect(html).toContain('https://example.com/verify?token=long_token_string');
      });
    });

    describe('generateVerificationReminderEmail', () => {
      it('should generate reminder email', () => {
        const html = generateVerificationReminderEmail({
          userName: 'Jane',
          verificationUrl: 'https://example.com/verify',
        });

        expect(html).toContain('E-Mail-Bestätigung ausstehend');
        expect(html).toContain('Hallo Jane');
        expect(html).toContain('Jetzt bestätigen');
      });
    });
  });

  describe('Password Reset Email Template', () => {
    describe('generatePasswordResetEmail', () => {
      it('should generate password reset email with user name', () => {
        const html = generatePasswordResetEmail({
          userName: 'Alice',
          resetUrl: 'https://example.com/reset?token=xyz789',
        });

        expect(html).toContain('Hallo Alice');
        expect(html).toContain('Passwort zurücksetzen');
        expect(html).toContain('https://example.com/reset?token=xyz789');
      });

      it('should generate password reset email without user name', () => {
        const html = generatePasswordResetEmail({
          resetUrl: 'https://example.com/reset',
        });

        expect(html).toContain('Hallo,');
        expect(html).not.toContain('Hallo undefined');
      });

      it('should include expiry time', () => {
        const html = generatePasswordResetEmail({
          resetUrl: 'https://example.com/reset',
          expiryMinutes: 60,
        });

        expect(html).toContain('60 Minuten');
      });

      it('should have default 30 minute expiry', () => {
        const html = generatePasswordResetEmail({
          resetUrl: 'https://example.com/reset',
        });

        expect(html).toContain('30 Minuten');
      });

      it('should include security warning', () => {
        const html = generatePasswordResetEmail({
          resetUrl: 'https://example.com/reset',
        });

        expect(html).toContain('Sicherheitshinweis');
        expect(html).toContain('Wenn Sie keine Passwortänderung angefordert haben');
      });

      it('should include password recommendations', () => {
        const html = generatePasswordResetEmail({
          resetUrl: 'https://example.com/reset',
        });

        expect(html).toContain('mindestens 8 Zeichen');
        expect(html).toContain('sicheres Passwort');
      });
    });

    describe('generatePasswordChangedEmail', () => {
      it('should generate password changed confirmation', () => {
        const html = generatePasswordChangedEmail('Bob');

        expect(html).toContain('Hallo Bob');
        expect(html).toContain('Passwort erfolgreich geändert');
        expect(html).toContain('Sie können sich jetzt mit Ihrem neuen Passwort');
      });

      it('should work without user name', () => {
        const html = generatePasswordChangedEmail();

        expect(html).toContain('Hallo,');
        expect(html).toContain('Passwort erfolgreich geändert');
      });

      it('should include security warning', () => {
        const html = generatePasswordChangedEmail();

        expect(html).toContain('Wenn Sie diese Änderung nicht vorgenommen haben');
        expect(html).toContain('support@docbits.com');
      });
    });
  });

  describe('Magic Link Email Template', () => {
    describe('generateMagicLinkEmail', () => {
      it('should generate magic link email with user name', () => {
        const html = generateMagicLinkEmail({
          userName: 'Charlie',
          magicLinkUrl: 'https://example.com/auth/magic?token=magic123',
        });

        expect(html).toContain('Hallo Charlie');
        expect(html).toContain('Ihr Anmelde-Link');
        expect(html).toContain('Jetzt anmelden');
        expect(html).toContain('https://example.com/auth/magic?token=magic123');
      });

      it('should generate magic link email without user name', () => {
        const html = generateMagicLinkEmail({
          magicLinkUrl: 'https://example.com/auth/magic',
        });

        expect(html).toContain('Hallo,');
        expect(html).not.toContain('Hallo undefined');
      });

      it('should include expiry time', () => {
        const html = generateMagicLinkEmail({
          magicLinkUrl: 'https://example.com/auth/magic',
          expiryMinutes: 15,
        });

        expect(html).toContain('15 Minuten');
      });

      it('should have default 10 minute expiry', () => {
        const html = generateMagicLinkEmail({
          magicLinkUrl: 'https://example.com/auth/magic',
        });

        expect(html).toContain('10 Minuten');
      });

      it('should include security warning', () => {
        const html = generateMagicLinkEmail({
          magicLinkUrl: 'https://example.com/auth/magic',
        });

        expect(html).toContain('Sicherheitshinweis');
        expect(html).toContain('ermöglicht den direkten Zugriff auf Ihr Konto');
        expect(html).toContain('Teilen Sie ihn nicht');
      });

      it('should include single-use notice', () => {
        const html = generateMagicLinkEmail({
          magicLinkUrl: 'https://example.com/auth/magic',
        });

        expect(html).toContain('kann nur einmal verwendet werden');
      });
    });
  });

  describe('Template Consistency', () => {
    it('all email templates should use base template', () => {
      const welcomeEmail = generateWelcomeEmail({
        verificationUrl: 'https://example.com',
      });
      const resetEmail = generatePasswordResetEmail({
        resetUrl: 'https://example.com',
      });
      const magicEmail = generateMagicLinkEmail({
        magicLinkUrl: 'https://example.com',
      });

      // All should have consistent branding
      [welcomeEmail, resetEmail, magicEmail].forEach(html => {
        expect(html).toContain('FELLOWPRO AG');
        expect(html).toContain('DocBits Software');
        expect(html).toContain('DocBits');
        expect(html).toContain('BEWIRTUNGSBELEG');
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('lang="de"');
      });
    });

    it('all templates should have primary color', () => {
      const templates = [
        generateWelcomeEmail({ verificationUrl: 'https://test.com' }),
        generatePasswordResetEmail({ resetUrl: 'https://test.com' }),
        generateMagicLinkEmail({ magicLinkUrl: 'https://test.com' }),
      ];

      templates.forEach(html => {
        expect(html).toContain('#228BE6'); // Primary blue color
      });
    });

    it('all templates should be responsive', () => {
      const templates = [
        generateWelcomeEmail({ verificationUrl: 'https://test.com' }),
        generatePasswordResetEmail({ resetUrl: 'https://test.com' }),
        generateMagicLinkEmail({ magicLinkUrl: 'https://test.com' }),
      ];

      templates.forEach(html => {
        expect(html).toContain('@media only screen and (max-width: 640px)');
      });
    });
  });
});

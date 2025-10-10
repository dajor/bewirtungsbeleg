/**
 * Tests for email mailer service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendEmail, sendBatchEmails, htmlToPlainText, validateEmailConfig } from './mailer';

// Create a shared mock that will be assigned in the mock factory
const createMockSend = () => {
  return vi.fn().mockResolvedValue({
    body: { messageId: 'msg-123' },
    statusCode: 202,
  });
};

// Mock environment
vi.mock('@/lib/env', () => ({
  env: {
    MAILERSEND_API_KEY: 'test-api-key-123',
  },
}));

// Mock MailerSend - using factory function approach
vi.mock('mailersend', () => {
  const send = vi.fn().mockResolvedValue({
    body: { messageId: 'msg-123' },
    statusCode: 202,
  });

  return {
    default: vi.fn(),
    MailerSend: vi.fn(() => ({
      email: {
        send,
      },
    })),
    EmailParams: vi.fn(function() {
      // @ts-ignore
      this.setFrom = vi.fn().mockReturnThis();
      // @ts-ignore
      this.setTo = vi.fn().mockReturnThis();
      // @ts-ignore
      this.setSubject = vi.fn().mockReturnThis();
      // @ts-ignore
      this.setHtml = vi.fn().mockReturnThis();
      // @ts-ignore
      this.setText = vi.fn().mockReturnThis();
    }),
    Sender: vi.fn((email: string, name: string) => ({ email, name })),
    Recipient: vi.fn((email: string, name: string) => ({ email, name })),
  };
});

describe('Email Mailer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully with basic options', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should include toName when provided', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        toName: 'Test User',
        subject: 'Test Email',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should include plain text when provided', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
        text: 'Hello World',
      });

      expect(result.success).toBe(true);
    });

    it('should use custom from address when provided', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello</p>',
        from: 'custom@example.com',
        fromName: 'Custom Sender',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendBatchEmails', () => {
    it('should send multiple emails successfully', async () => {
      const emails = [
        {
          to: 'user1@example.com',
          subject: 'Email 1',
          html: '<p>Email 1</p>',
        },
        {
          to: 'user2@example.com',
          subject: 'Email 2',
          html: '<p>Email 2</p>',
        },
        {
          to: 'user3@example.com',
          subject: 'Email 3',
          html: '<p>Email 3</p>',
        },
      ];

      const results = await sendBatchEmails(emails);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle empty batch', async () => {
      const results = await sendBatchEmails([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('htmlToPlainText', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = htmlToPlainText(html);
      expect(text).toBe('Hello World');
    });

    it('should convert HTML entities', () => {
      const html = 'Hello&nbsp;&amp;&nbsp;World';
      const text = htmlToPlainText(html);
      expect(text).toBe('Hello & World');
    });

    it('should handle quotes and apostrophes', () => {
      const html = 'It&quot;s a &quot;test&quot; with &#39;quotes&#39;';
      const text = htmlToPlainText(html);
      expect(text).toBe('It"s a "test" with \'quotes\'');
    });

    it('should handle angle brackets', () => {
      const html = '5 &lt; 10 &gt; 3';
      const text = htmlToPlainText(html);
      expect(text).toBe('5 < 10 > 3');
    });

    it('should normalize whitespace', () => {
      const html = '<p>Hello   \n\n   World</p>';
      const text = htmlToPlainText(html);
      expect(text).toBe('Hello World');
    });

    it('should trim leading and trailing whitespace', () => {
      const html = '  <p>Hello World</p>  ';
      const text = htmlToPlainText(html);
      expect(text).toBe('Hello World');
    });

    it('should handle complex HTML structure', () => {
      const html = `
        <div>
          <h1>Welcome</h1>
          <p>This is a <a href="#">test</a> message.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const text = htmlToPlainText(html);
      expect(text).toContain('Welcome');
      expect(text).toContain('test');
      expect(text).toContain('Item 1');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should handle empty string', () => {
      expect(htmlToPlainText('')).toBe('');
    });

    it('should handle plain text', () => {
      const text = 'Plain text without HTML';
      expect(htmlToPlainText(text)).toBe(text);
    });
  });

  describe('validateEmailConfig', () => {
    it('should return true when API key is configured', () => {
      expect(validateEmailConfig()).toBe(true);
    });
  });

  describe('Email formatting', () => {
    it('should handle special characters in email content', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test with Umlauts: äöü ÄÖÜ ß',
        html: '<p>Grüße aus München!</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should handle long email subjects', async () => {
      const longSubject = 'A'.repeat(200);
      const result = await sendEmail({
        to: 'test@example.com',
        subject: longSubject,
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should handle large HTML content', async () => {
      const largeHtml = '<p>' + 'Content '.repeat(1000) + '</p>';
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Large Email',
        html: largeHtml,
      });

      expect(result.success).toBe(true);
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { sanitizeHtml, escapeHtml, sanitizeFilename, sanitizeUrl, sanitizeJsonInput } from './sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <strong>Strong</strong>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<b>Bold</b> <i>Italic</i> <strong>Strong</strong>');
    });

    it('should remove dangerous tags', () => {
      const input = '<script>alert("xss")</script><b>Safe</b>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<b>Safe</b>');
    });

    it('should remove event handlers', () => {
      const input = '<b onclick="alert()">Click me</b>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<b>Click me</b>');
    });

    it('should remove dangerous protocols', () => {
      const input = '<a href="javascript:alert()">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).toBe('Link'); // <a> tag not in allowed list
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("It's a test & more")).toBe("It&#039;s a test &amp; more");
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeFilename', () => {
    it('should allow safe characters', () => {
      expect(sanitizeFilename('file-name_123.jpg')).toBe('file-name_123.jpg');
    });

    it('should replace unsafe characters', () => {
      expect(sanitizeFilename('file/name\\test.jpg')).toBe('file_name_test.jpg');
      expect(sanitizeFilename('file:name*test?.jpg')).toBe('file_name_test_.jpg');
    });

    it('should prevent path traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('____windows_system32');
    });

    it('should handle multiple dots', () => {
      expect(sanitizeFilename('file...name.jpg')).toBe('file_name.jpg');
    });

    it('should replace leading dot', () => {
      expect(sanitizeFilename('.hidden-file')).toBe('_hidden-file');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
      expect(sanitizeUrl('https://example.com/path?query=1')).toBe(
        'https://example.com/path?query=1'
      );
    });

    it('should reject dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert()')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert()</script>')).toBeNull();
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
      expect(sanitizeUrl('')).toBeNull();
    });
  });

  describe('sanitizeJsonInput', () => {
    it('should remove dangerous properties', () => {
      const input = {
        safe: 'value',
        __proto__: { evil: true },
        constructor: { evil: true },
        prototype: { evil: true },
      };
      const output = sanitizeJsonInput(input);
      expect(output).toEqual({ safe: 'value' });
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'John',
          __proto__: { evil: true },
        },
        data: {
          value: 42,
          constructor: { evil: true },
        },
      };
      const output = sanitizeJsonInput(input);
      expect(output).toEqual({
        user: { name: 'John' },
        data: { value: 42 },
      });
    });

    it('should preserve arrays and non-object values', () => {
      const input = {
        array: [1, 2, 3],
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
      };
      const output = sanitizeJsonInput(input);
      expect(output).toEqual(input);
    });
  });
});
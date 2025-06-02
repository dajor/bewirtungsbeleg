import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for strict sanitization
const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, config);
}

/**
 * Sanitize user input for display
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // First replace directory separators
  let safe = filename.replace(/[\/\\]/g, '_');
  // Then replace other unsafe characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Replace multiple dots
  safe = safe.replace(/\.{2,}/g, '_');
  // Replace leading dot
  safe = safe.replace(/^\./, '_');
  return safe;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Remove potentially dangerous properties from objects
 */
export function sanitizeJsonInput<T extends Record<string, any>>(obj: T): T {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (dangerous.includes(key)) {
      continue;
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeJsonInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
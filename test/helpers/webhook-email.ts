/**
 * Helper utility to retrieve emails from webhook endpoint
 * Used in Playwright E2E tests with MailerSend webhook integration
 */

interface WebhookEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  receivedAt: string;
  verificationLink?: string;
  resetLink?: string;
  magicLink?: string;
}

interface WebhookResponse {
  success: boolean;
  email?: WebhookEmail;
  verificationLink?: string;
  error?: string;
  message?: string;
}

/**
 * Wait for email to arrive via webhook
 * @param email - Email address to check
 * @param maxAttempts - Maximum retry attempts (default: 30)
 * @param delayMs - Delay between attempts in ms (default: 1000)
 * @param baseUrl - Base URL for API (default: http://localhost:3000)
 * @returns Email content or null if timeout
 */
export async function waitForWebhookEmail(
  email: string,
  maxAttempts: number = 30,
  delayMs: number = 1000,
  baseUrl: string = 'http://localhost:3000'
): Promise<WebhookEmail | null> {
  console.log(`⏳ Waiting for email to arrive via webhook for: ${email}`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${baseUrl}/api/webhook/register?email=${encodeURIComponent(email)}`
      );

      if (response.ok) {
        const data: WebhookResponse = await response.json();

        if (data.success && data.email) {
          console.log(`✓ Email received after ${i + 1} attempt(s)`);
          console.log(`📧 Subject: ${data.email.subject}`);

          if (data.verificationLink) {
            console.log(`🔗 Verification link: ${data.verificationLink.substring(0, 60)}...`);
          }

          return data.email;
        }
      }
    } catch (error) {
      // Ignore fetch errors and keep retrying
      console.log(`Attempt ${i + 1}/${maxAttempts}: Not yet received...`);
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`❌ Email not received after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s)`);
  return null;
}

/**
 * Extract verification link from webhook email
 * @param email - Stored webhook email
 * @returns Verification link or null if not found
 */
export function extractVerificationLink(email: WebhookEmail): string | null {
  // First check if it's already extracted
  if (email.verificationLink) {
    return email.verificationLink;
  }

  // Try HTML
  const htmlMatch = email.html.match(/href=["']([^"']*\/auth\/setup-password\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text
  const textMatch = email.text.match(/(https?:\/\/[^\s]+\/auth\/setup-password\?token=[^\s]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return null;
}

/**
 * Wait for password reset email to arrive via webhook
 * @param email - Email address to check
 * @param maxAttempts - Maximum retry attempts (default: 30)
 * @param delayMs - Delay between attempts in ms (default: 1000)
 * @param baseUrl - Base URL for API (default: http://localhost:3000)
 * @returns Email content or null if timeout
 */
export async function waitForPasswordResetEmail(
  email: string,
  maxAttempts: number = 30,
  delayMs: number = 1000,
  baseUrl: string = 'http://localhost:3000'
): Promise<WebhookEmail | null> {
  console.log(`⏳ Waiting for password reset email via webhook for: ${email}`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${baseUrl}/api/webhook/password-forget?email=${encodeURIComponent(email)}`
      );

      if (response.ok) {
        const data: WebhookResponse = await response.json();

        if (data.success && data.email) {
          console.log(`✓ Password reset email received after ${i + 1} attempt(s)`);
          console.log(`📧 Subject: ${data.email.subject}`);

          if (data.email.resetLink) {
            console.log(`🔗 Reset link: ${data.email.resetLink.substring(0, 60)}...`);
          }

          return data.email;
        }
      }
    } catch (error) {
      // Ignore fetch errors and keep retrying
      console.log(`Attempt ${i + 1}/${maxAttempts}: Not yet received...`);
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`❌ Password reset email not received after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s)`);
  return null;
}

/**
 * Extract password reset link from webhook email
 * @param email - Stored webhook email
 * @returns Reset link or null if not found
 */
export function extractPasswordResetLink(email: WebhookEmail): string | null {
  // First check if it's already extracted
  if (email.resetLink) {
    return email.resetLink;
  }

  // Try HTML
  const htmlMatch = email.html.match(/href=["']([^"']*\/auth\/reset-password\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text
  const textMatch = email.text.match(/(https?:\/\/[^\s]+\/auth\/reset-password\?token=[^\s]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return null;
}

/**
 * Wait for magic link email to arrive via webhook
 * @param email - Email address to check
 * @param maxAttempts - Maximum retry attempts (default: 30)
 * @param delayMs - Delay between attempts in ms (default: 1000)
 * @param baseUrl - Base URL for API (default: http://localhost:3000)
 * @returns Email content or null if timeout
 */
export async function waitForMagicLinkEmail(
  email: string,
  maxAttempts: number = 30,
  delayMs: number = 1000,
  baseUrl: string = 'http://localhost:3000'
): Promise<WebhookEmail | null> {
  console.log(`⏳ Waiting for magic link email via webhook for: ${email}`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${baseUrl}/api/webhook/magic-link?email=${encodeURIComponent(email)}`
      );

      if (response.ok) {
        const data: WebhookResponse = await response.json();

        if (data.success && data.email) {
          console.log(`✓ Magic link email received after ${i + 1} attempt(s)`);
          console.log(`📧 Subject: ${data.email.subject}`);

          if (data.email.magicLink) {
            console.log(`🔗 Magic link: ${data.email.magicLink.substring(0, 60)}...`);
          }

          return data.email;
        }
      }
    } catch (error) {
      // Ignore fetch errors and keep retrying
      console.log(`Attempt ${i + 1}/${maxAttempts}: Not yet received...`);
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`❌ Magic link email not received after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s)`);
  return null;
}

/**
 * Extract magic link from webhook email
 * @param email - Stored webhook email
 * @returns Magic link or null if not found
 */
export function extractMagicLink(email: WebhookEmail): string | null {
  // First check if it's already extracted
  if (email.magicLink) {
    return email.magicLink;
  }

  // Try HTML
  const htmlMatch = email.html.match(/href=["']([^"']*\/api\/auth\/magic-link\/verify\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text
  const textMatch = email.text.match(/(https?:\/\/[^\s]+\/api\/auth\/magic-link\/verify\?token=[^\s]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return null;
}

/**
 * Clear stored webhook emails (cleanup after tests)
 * @param email - Optional specific email to clear (clears all if not provided)
 * @param webhookType - Type of webhook to clear ('register', 'password-forget', 'magic-link', or 'all')
 * @param baseUrl - Base URL for API (default: http://localhost:3000)
 */
export async function clearWebhookEmails(
  email?: string,
  webhookType: 'register' | 'password-forget' | 'magic-link' | 'all' = 'all',
  baseUrl: string = 'http://localhost:3000'
): Promise<void> {
  const endpoints = webhookType === 'all'
    ? ['register', 'password-forget', 'magic-link']
    : [webhookType];

  for (const endpoint of endpoints) {
    try {
      const url = email
        ? `${baseUrl}/api/webhook/${endpoint}?email=${encodeURIComponent(email)}`
        : `${baseUrl}/api/webhook/${endpoint}`;

      await fetch(url, { method: 'DELETE' });
      console.log(`🧹 Cleared ${endpoint} webhook emails${email ? ` for ${email}` : ''}`);
    } catch (error) {
      console.error(`Failed to clear ${endpoint} webhook emails:`, error);
    }
  }
}

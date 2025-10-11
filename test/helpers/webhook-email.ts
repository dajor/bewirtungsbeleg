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
 * Clear stored webhook emails (cleanup after tests)
 * @param email - Optional specific email to clear (clears all if not provided)
 * @param baseUrl - Base URL for API (default: http://localhost:3000)
 */
export async function clearWebhookEmails(
  email?: string,
  baseUrl: string = 'http://localhost:3000'
): Promise<void> {
  try {
    const url = email
      ? `${baseUrl}/api/webhook/register?email=${encodeURIComponent(email)}`
      : `${baseUrl}/api/webhook/register`;

    await fetch(url, { method: 'DELETE' });
    console.log(`🧹 Cleared webhook emails${email ? ` for ${email}` : ''}`);
  } catch (error) {
    console.error('Failed to clear webhook emails:', error);
  }
}

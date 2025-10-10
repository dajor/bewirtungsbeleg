/**
 * Helper utility to retrieve email verification tokens from storage
 * Used in Playwright E2E tests to access real tokens without email API
 */

import { getTokenByEmail } from '../../src/lib/email/token-storage';
import type { EmailToken } from '../../src/lib/email/utils';

/**
 * Retrieve verification token for a given email address
 * @param email - Email address to look up
 * @param type - Token type (default: 'email_verify')
 * @returns Token string or null if not found
 */
export async function getVerificationToken(
  email: string,
  type: EmailToken['type'] = 'email_verify'
): Promise<string | null> {
  try {
    const token = await getTokenByEmail(email, type);
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}

/**
 * Wait for token to be available in storage
 * Useful when token generation is async
 * @param email - Email address to look up
 * @param type - Token type (default: 'email_verify')
 * @param maxAttempts - Maximum retry attempts (default: 10)
 * @param delayMs - Delay between attempts in ms (default: 500)
 * @returns Token string or null if timeout
 */
export async function waitForToken(
  email: string,
  type: EmailToken['type'] = 'email_verify',
  maxAttempts: number = 10,
  delayMs: number = 500
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const token = await getVerificationToken(email, type);
    if (token) {
      console.log(`Token found after ${i + 1} attempt(s)`);
      return token;
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`Token not found after ${maxAttempts} attempts`);
  return null;
}

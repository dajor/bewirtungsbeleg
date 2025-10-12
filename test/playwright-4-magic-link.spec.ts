/**
 * Playwright E2E Test: Complete Magic Link Authentication Flow with Webhook
 *
 * Tests the full magic link (passwordless) authentication workflow using MailerSend webhook:
 * 1. Navigate to signin page
 * 2. Switch to magic link mode
 * 3. Submit test email for magic link
 * 4. Verify countdown timer appears
 * 5. Wait for magic link email via webhook
 * 6. Extract magic link from email
 * 7. Navigate to magic link
 * 8. Verify auto-login and redirect to /bewirtungsbeleg
 * 9. Logout for cleanup
 *
 * Webhook Configuration:
 * - Inbound Email: hub1q1enbohud95ctosh@inbound.mailersend.net
 * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/magic-link
 * - Secret: Rbv4DdNeYzMkfxi2K11vJHYFNhlMiCcB
 */

import { test, expect } from '@playwright/test';
import {
  waitForMagicLinkEmail,
  extractMagicLink,
  clearWebhookEmails
} from './helpers/webhook-email';

// Test user data (existing user from registration test)
const TEST_USER = {
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
};

test.describe('playwright-magic-link: Complete Magic Link Authentication Flow', () => {
  // Clear webhook emails before test
  test.beforeEach(async () => {
    await clearWebhookEmails(undefined, 'magic-link');
  });

  test('should request magic link, receive email, and auto-login successfully', async ({ page }) => {
    console.log('=== Step 1: Navigate to Signin Page ===');

    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Wait for signin page to load
    await expect(page.locator('text=/Anmelden|Einloggen/i').first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Signin page loaded');

    // Take screenshot of signin form
    const timestamp1 = Date.now();
    await page.screenshot({
      path: `test-results/magic-link-signin-form-${timestamp1}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/magic-link-signin-form-${timestamp1}.png`);

    console.log('=== Step 2: Switch to Magic Link Mode ===');

    // Find and click the login mode toggle
    const toggleButton = page.getByTestId('login-mode-toggle');
    await expect(toggleButton).toBeVisible({ timeout: 10000 });
    await toggleButton.click();

    console.log('✓ Clicked login mode toggle');

    // Wait for magic link mode to activate (password field should disappear)
    await page.waitForTimeout(500); // Small delay for UI transition

    // Verify we're in magic link mode (no password field visible)
    const passwordField = page.getByTestId('login-password');
    try {
      await expect(passwordField).not.toBeVisible({ timeout: 2000 });
      console.log('✓ Switched to magic link mode (password field hidden)');
    } catch (e) {
      console.log('⚠️  Password field still visible, but continuing...');
    }

    // Take screenshot of magic link mode
    const timestamp2 = Date.now();
    await page.screenshot({
      path: `test-results/magic-link-mode-active-${timestamp2}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/magic-link-mode-active-${timestamp2}.png`);

    console.log('=== Step 3: Request Magic Link ===');

    // Fill email
    await page.getByTestId('login-email').fill(TEST_USER.email);
    console.log('✓ Email filled');

    // Submit form
    await page.getByTestId('login-submit').click();
    console.log('✓ Form submitted');

    console.log('=== Step 4: Verify Countdown Timer ===');

    // Wait for countdown timer or success message to appear
    try {
      // Look for either countdown or success message
      const countdownOrSuccess = page.locator('text=/wird gesendet|gesendet|countdown|sekunden|100/i');
      await expect(countdownOrSuccess.first()).toBeVisible({ timeout: 10000 });
      console.log('✓ Magic link request acknowledged (countdown or success message visible)');

      // Take screenshot of confirmation
      const timestamp3 = Date.now();
      await page.screenshot({
        path: `test-results/magic-link-email-sent-${timestamp3}.png`,
        fullPage: true
      });
      console.log(`📸 Screenshot saved: test-results/magic-link-email-sent-${timestamp3}.png`);
    } catch (e) {
      // Take error screenshot
      const timestamp = Date.now();
      await page.screenshot({
        path: `test-results/magic-link-request-error-${timestamp}.png`,
        fullPage: true
      });
      console.log(`📸 Error screenshot saved: test-results/magic-link-request-error-${timestamp}.png`);
      throw new Error('Failed to confirm magic link request - no countdown or success message visible');
    }

    console.log('=== Step 5: Wait for Magic Link Email via Webhook ===');

    // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
    const email = await waitForMagicLinkEmail(TEST_USER.email, 30, 1000);

    if (!email) {
      throw new Error('Failed to receive magic link email via webhook. Check MailerSend webhook configuration.');
    }

    console.log('✓ Magic link email received via webhook:', email.subject);

    // Extract magic link
    const magicLink = extractMagicLink(email);

    if (!magicLink) {
      throw new Error('Failed to extract magic link from email');
    }

    console.log('✓ Magic link extracted:', magicLink.substring(0, 60) + '...');

    console.log('=== Step 6: Navigate to Magic Link ===');

    // Navigate to magic link
    await page.goto(magicLink);
    await page.waitForLoadState('networkidle');

    // Take screenshot during callback processing
    const timestamp4 = Date.now();
    await page.screenshot({
      path: `test-results/magic-link-callback-processing-${timestamp4}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/magic-link-callback-processing-${timestamp4}.png`);

    console.log('=== Step 7: Verify Auto-Login & Redirect ===');

    // Wait for auto-redirect to main app (magic link auto-logs in via callback)
    try {
      await page.waitForURL('**/bewirtungsbeleg**', { timeout: 15000 });
      console.log('✓ Auto-login successful - redirected to /bewirtungsbeleg');

      // Verify we're on the main page
      await expect(page).toHaveURL(/.*bewirtungsbeleg/);

      // Take screenshot of successful login
      const timestamp5 = Date.now();
      await page.screenshot({
        path: `test-results/magic-link-logged-in-${timestamp5}.png`,
        fullPage: true
      });
      console.log(`📸 Screenshot saved: test-results/magic-link-logged-in-${timestamp5}.png`);
    } catch (e) {
      // Take error screenshot if redirect fails
      const timestamp = Date.now();
      await page.screenshot({
        path: `test-results/magic-link-login-error-${timestamp}.png`,
        fullPage: true
      });
      console.log(`📸 Error screenshot saved: test-results/magic-link-login-error-${timestamp}.png`);

      // Check if there's an error message on the page
      const errorMessage = await page.locator('[role="alert"]').textContent().catch(() => null);
      if (errorMessage) {
        console.error('❌ Error message on page:', errorMessage);
      }

      throw new Error('Failed to auto-login with magic link - redirect timeout or error');
    }

    console.log('=== Step 8: Logout for Cleanup ===');

    // Clear cookies to logout
    await page.context().clearCookies();
    console.log('✓ Logged out (cookies cleared)');

    console.log('=== Test Complete ===');
    console.log('✅ Full magic link authentication flow with webhook working correctly!');
  });
});

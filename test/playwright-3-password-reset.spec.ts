/**
 * Playwright E2E Test: Complete Password Reset Flow with Webhook
 *
 * Tests the full password reset workflow using MailerSend webhook:
 * 1. Navigate to forgot password page
 * 2. Submit test email for password reset
 * 3. Wait for reset email via webhook
 * 4. Extract reset link from email
 * 5. Navigate to reset link and set new password
 * 6. Auto-login with new password
 * 7. Verify redirect to /bewirtungsbeleg
 * 8. Logout and reset password back to original
 * 9. Login again to confirm original password restored
 *
 * Webhook Configuration:
 * - Inbound Email: yzwmdjgob38u0x4txzzv@inbound.mailersend.net
 * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/password-forget
 * - Secret: LTgupNfVt0ibdUnv8DT3SPeaEE1oRUT4
 */

import { test, expect } from '@playwright/test';
import {
  waitForPasswordResetEmail,
  extractPasswordResetLink,
  clearWebhookEmails
} from './helpers/webhook-email';

// Test user data (existing user from registration test)
const TEST_USER = {
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
  currentPassword: 'Tester45%',
  newPassword: 'NewTester45%',
};

test.describe('playwright-password-reset: Complete Password Reset Flow', () => {
  // Clear webhook emails before test
  test.beforeEach(async () => {
    await clearWebhookEmails(undefined, 'password-forget');
  });

  test('should reset password, auto-login, then restore original password', async ({ page }) => {
    console.log('=== Step 1: Request Password Reset ===');

    // Navigate to forgot password page (using German URL from actual frontend)
    await page.goto('/auth/passwort-vergessen');
    await page.waitForLoadState('networkidle');

    // Take screenshot of forgot password form
    const timestamp1 = Date.now();
    await page.screenshot({
      path: `test-results/password-reset-form-${timestamp1}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/password-reset-form-${timestamp1}.png`);

    // Wait for form to be visible
    await expect(page.locator('text=/Passwort vergessen/i')).toBeVisible({ timeout: 10000 });

    // Fill email and submit
    await page.getByTestId('forgot-password-email').fill(TEST_USER.email);
    await page.getByTestId('forgot-password-submit').click();

    // Wait for success message
    try {
      await expect(page.getByTestId('forgot-password-success')).toBeVisible({ timeout: 10000 });
      console.log('✓ Password reset email requested - success message displayed');

      // Take screenshot of success
      const timestamp2 = Date.now();
      await page.screenshot({
        path: `test-results/password-reset-email-sent-${timestamp2}.png`,
        fullPage: true
      });
      console.log(`📸 Screenshot saved: test-results/password-reset-email-sent-${timestamp2}.png`);
    } catch (e) {
      // Take error screenshot
      const timestamp = Date.now();
      await page.screenshot({
        path: `test-results/password-reset-request-error-${timestamp}.png`,
        fullPage: true
      });
      console.log(`📸 Error screenshot saved: test-results/password-reset-request-error-${timestamp}.png`);
      throw e;
    }

    console.log('=== Step 2: Wait for Reset Email via Webhook ===');

    // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
    const email = await waitForPasswordResetEmail(TEST_USER.email, 30, 1000);

    if (!email) {
      throw new Error('Failed to receive password reset email via webhook. Check MailerSend webhook configuration.');
    }

    console.log('✓ Password reset email received via webhook:', email.subject);

    // Extract reset link
    const resetLink = extractPasswordResetLink(email);

    if (!resetLink) {
      throw new Error('Failed to extract reset link from email');
    }

    console.log('✓ Reset link extracted:', resetLink.substring(0, 60) + '...');

    console.log('=== Step 3: Navigate to Reset Link and Set New Password ===');

    // Navigate to reset link
    await page.goto(resetLink);
    await page.waitForLoadState('networkidle');

    // Wait for reset password form
    await expect(page.locator('text=/Passwort zurücksetzen/i')).toBeVisible({ timeout: 10000 });
    console.log('✓ Reset password form displayed');

    // Take screenshot of reset form
    const timestamp3 = Date.now();
    await page.screenshot({
      path: `test-results/password-reset-new-password-form-${timestamp3}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/password-reset-new-password-form-${timestamp3}.png`);

    // Fill new password
    await page.getByTestId('reset-password-password').fill(TEST_USER.newPassword);
    await page.getByTestId('reset-password-confirmPassword').fill(TEST_USER.newPassword);

    // Submit password form
    await page.getByTestId('reset-password-submit').click();

    // Wait for success message
    try {
      await expect(page.getByTestId('reset-password-success')).toBeVisible({ timeout: 10000 });
      console.log('✓ Password reset successful - success message displayed');

      // Take screenshot of success
      const timestamp4 = Date.now();
      await page.screenshot({
        path: `test-results/password-reset-success-${timestamp4}.png`,
        fullPage: true
      });
      console.log(`📸 Screenshot saved: test-results/password-reset-success-${timestamp4}.png`);
    } catch (e) {
      // Take error screenshot
      const timestamp = Date.now();
      await page.screenshot({
        path: `test-results/password-reset-error-${timestamp}.png`,
        fullPage: true
      });
      console.log(`📸 Error screenshot saved: test-results/password-reset-error-${timestamp}.png`);
      throw e;
    }

    console.log('=== Step 4: Verify Auto-Login & Redirect ===');

    // Wait for auto-redirect to main app (password reset page auto-logs in)
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 15000 });
    console.log('✓ Auto-login successful - redirected to /bewirtungsbeleg');

    // Verify we're on the main page
    await expect(page).toHaveURL(/.*bewirtungsbeleg/);

    // Take screenshot of successful login with new password
    const timestamp5 = Date.now();
    await page.screenshot({
      path: `test-results/password-reset-logged-in-${timestamp5}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/password-reset-logged-in-${timestamp5}.png`);

    console.log('=== Step 5: Logout ===');

    // Clear cookies to logout
    await page.context().clearCookies();
    console.log('✓ Logged out (cookies cleared)');

    console.log('=== Step 6: Reset Password Back to Original ===');

    // Request password reset again (to restore original password)
    await page.goto('/auth/passwort-vergessen');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('forgot-password-email').fill(TEST_USER.email);
    await page.getByTestId('forgot-password-submit').click();

    await expect(page.getByTestId('forgot-password-success')).toBeVisible({ timeout: 10000 });
    console.log('✓ Second password reset requested');

    // Wait for second reset email
    const email2 = await waitForPasswordResetEmail(TEST_USER.email, 30, 1000);

    if (!email2) {
      throw new Error('Failed to receive second password reset email via webhook');
    }

    const resetLink2 = extractPasswordResetLink(email2);

    if (!resetLink2) {
      throw new Error('Failed to extract second reset link from email');
    }

    console.log('✓ Second reset link extracted');

    // Navigate to second reset link and restore original password
    await page.goto(resetLink2);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/Passwort zurücksetzen/i')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('reset-password-password').fill(TEST_USER.currentPassword);
    await page.getByTestId('reset-password-confirmPassword').fill(TEST_USER.currentPassword);

    await page.getByTestId('reset-password-submit').click();

    await expect(page.getByTestId('reset-password-success')).toBeVisible({ timeout: 10000 });
    console.log('✓ Original password restored');

    // Wait for auto-redirect
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 15000 });
    console.log('✓ Auto-login successful after password restore');

    // Clear cookies again
    await page.context().clearCookies();
    console.log('✓ Logged out');

    console.log('=== Step 7: Verify Login with Original Password ===');

    // Navigate to signin page (using German URL)
    await page.goto('/auth/anmelden');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.getByTestId('login-email').fill(TEST_USER.email);
    await page.getByTestId('login-password').fill(TEST_USER.currentPassword);
    await page.getByTestId('login-submit').click();

    // Wait for redirect to main app
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
    console.log('✓ Login successful with original password');

    // Verify we're on the main page
    await expect(page).toHaveURL(/.*bewirtungsbeleg/);

    // Take final screenshot
    const timestamp6 = Date.now();
    await page.screenshot({
      path: `test-results/password-reset-final-login-${timestamp6}.png`,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: test-results/password-reset-final-login-${timestamp6}.png`);

    // Clear cookies for next test
    await page.context().clearCookies();
    console.log('✓ Logged out (final cleanup)');

    console.log('=== Test Complete ===');
    console.log('✅ Full password reset flow with webhook working correctly!');
    console.log('✅ Password changed and restored successfully!');
  });
});

/**
 * Playwright E2E Test: Complete Registration Flow with Webhook
 *
 * Tests the full registration workflow using MailerSend webhook:
 * 1. Register with test email (Test Tester - uzylloqimwnkvwjfufeq@inbound.mailersend.net)
 * 2. Wait for email via webhook
 * 3. Extract verification link from email
 * 4. Setup password (Tester45%)
 * 5. Auto-login to /bewirtungsbeleg
 * 6. Logout for next test
 */

import { test, expect } from '@playwright/test';
import { waitForWebhookEmail, extractVerificationLink, clearWebhookEmails } from './helpers/webhook-email';

// Test user data as specified by user
const TEST_USER = {
  firstName: 'Test',
  lastName: 'Tester',
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
  password: 'Tester45%',
};

test.describe('playwright-register: Complete Registration Flow', () => {
  // Clear webhook emails before test
  test.beforeEach(async () => {
    await clearWebhookEmails();
  });

  test('should register, verify email via webhook, setup password, and login successfully', async ({ page }) => {
    console.log('=== Step 1: Registration Form ===');

    // Navigate to registration page
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.locator('text=/Konto erstellen/i')).toBeVisible({ timeout: 10000 });

    // Fill registration form using data-testid selectors
    await page.getByTestId('register-firstName').fill(TEST_USER.firstName);
    await page.getByTestId('register-lastName').fill(TEST_USER.lastName);
    await page.getByTestId('register-email').fill(TEST_USER.email);

    // Accept terms and conditions
    await page.getByTestId('register-acceptTerms').check();

    // Submit registration
    await page.getByTestId('register-submit').click();

    // Wait for success message
    await expect(page.getByRole('heading', { name: /E-Mail gesendet/i })).toBeVisible({ timeout: 10000 });
    console.log('✓ Registration successful - verification email sent');

    console.log('=== Step 2: Wait for Email via Webhook ===');

    // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
    const email = await waitForWebhookEmail(TEST_USER.email, 30, 1000);

    if (!email) {
      throw new Error('Failed to receive verification email via webhook. Check MailerSend webhook configuration.');
    }

    console.log('✓ Email received via webhook:', email.subject);

    // Extract verification link
    const verificationLink = extractVerificationLink(email);

    if (!verificationLink) {
      throw new Error('Failed to extract verification link from email');
    }

    console.log('✓ Verification link extracted:', verificationLink.substring(0, 60) + '...');

    console.log('=== Step 3: Password Setup ===');

    // Navigate to verification link
    await page.goto(verificationLink);

    // Wait for verification to complete
    await expect(page.locator('text=/E-Mail-Adresse wird verifiziert/i')).toBeVisible({ timeout: 5000 });
    console.log('✓ Token verification started');

    // Wait for password setup form to appear
    await expect(page.getByTestId('setup-password')).toBeVisible({ timeout: 10000 });
    console.log('✓ Token verified - password setup form displayed');

    // Verify email is displayed
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();

    // Fill password fields using data-testid
    await page.getByTestId('setup-password').fill(TEST_USER.password);
    await page.getByTestId('setup-confirmPassword').fill(TEST_USER.password);

    // Submit password form
    await page.getByTestId('setup-submit').click();

    // Wait for success message
    const successHeading = page.getByRole('heading', { name: /Konto erfolgreich erstellt/i });
    const errorAlert = page.locator('[role="alert"]').filter({ has: page.locator('text=/Fehler|Error/i') });

    try {
      await expect(successHeading).toBeVisible({ timeout: 10000 });
      console.log('✓ Password setup successful - account created');
    } catch (e) {
      // Take screenshot on error
      const timestamp = Date.now();
      await page.screenshot({ path: `test-results/password-setup-error-${timestamp}.png`, fullPage: true });
      console.log(`📸 Screenshot saved: test-results/password-setup-error-${timestamp}.png`);

      // Check if there's an error
      const isErrorVisible = await errorAlert.isVisible();
      if (isErrorVisible) {
        const errorText = await errorAlert.textContent();
        console.log('❌ Error after password submit:', errorText);
        throw new Error(`Password setup failed: ${errorText}`);
      }
      throw e;
    }

    console.log('=== Step 4: Auto-Login & Redirect ===');

    // Wait for auto-redirect to main app
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
    console.log('✓ Auto-login successful - redirected to /bewirtungsbeleg');

    // Verify we're on the main page
    await expect(page).toHaveURL(/.*bewirtungsbeleg/);

    // Take screenshot of successful registration
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/registration-complete-${timestamp}.png`, fullPage: true });
    console.log(`📸 Success screenshot saved: test-results/registration-complete-${timestamp}.png`);

    console.log('=== Step 5: Logout for Next Test ===');

    // TODO: Implement logout logic when user menu is available
    // For now, just clear cookies and session
    await page.context().clearCookies();
    console.log('✓ Logged out (cookies cleared)');

    console.log('=== Test Complete ===');
    console.log('✅ Full registration flow with webhook working correctly!');
  });
});

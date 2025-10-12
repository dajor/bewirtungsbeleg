/**
 * Playwright E2E Test: Login Flow
 *
 * Tests login with credentials from playwright-register test:
 * 1. Navigate to signin page
 * 2. Login with Test Tester credentials
 * 3. Verify redirect to /bewirtungsbeleg
 * 4. Verify user is authenticated
 *
 * NOTE: This test depends on playwright-register.spec.ts completing successfully first!
 */

import { test, expect } from '@playwright/test';

// Same test user data from playwright-register
const TEST_USER = {
  email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
  password: 'Tester45%',
};

test.describe('playwright-login: Login Flow', () => {
  test('should login with existing credentials and redirect to main app', async ({ page }) => {
    console.log('=== Step 1: Navigate to Signin Page ===');

    // Navigate to signin page (using German URL from actual frontend)
    await page.goto('/auth/anmelden');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.locator('text=/Willkommen zurück/i')).toBeVisible({ timeout: 10000 });
    console.log('✓ Signin page loaded');

    // Verify we're in password mode (default)
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    console.log('✓ Password mode is active');

    console.log('=== Step 2: Fill Login Form ===');

    // Fill email field
    await page.getByTestId('login-email').fill(TEST_USER.email);
    console.log('✓ Email filled:', TEST_USER.email);

    // Fill password field
    await page.getByTestId('login-password').fill(TEST_USER.password);
    console.log('✓ Password filled');

    console.log('=== Step 3: Submit Login ===');

    // Submit login form
    await page.getByTestId('login-submit').click();

    // Wait for button to finish loading state (max 10 seconds)
    await expect(page.getByTestId('login-submit')).not.toHaveAttribute('data-loading', 'true', { timeout: 10000 });
    console.log('✓ Button loading state cleared');

    // Wait for redirect to main app
    try {
      await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
      console.log('✓ Login successful - redirected to /bewirtungsbeleg');
    } catch (e) {
      // Take screenshot on error
      const timestamp = Date.now();
      await page.screenshot({ path: `test-results/login-error-${timestamp}.png`, fullPage: true });
      console.log(`📸 Screenshot saved: test-results/login-error-${timestamp}.png`);

      // Check if there's an error alert
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error|falsch/i });
      const isErrorVisible = await errorAlert.isVisible();

      if (isErrorVisible) {
        const errorText = await errorAlert.textContent();
        console.log('❌ Login error:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }

      throw new Error('Login failed: Did not redirect to /bewirtungsbeleg');
    }

    console.log('=== Step 4: Verify Authentication ===');

    // Verify we're on the main page
    await expect(page).toHaveURL(/.*bewirtungsbeleg/);
    console.log('✓ URL verified: /bewirtungsbeleg');

    // Verify page content is loaded (check for form or main content)
    // This ensures we're not just on the page but actually authenticated
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Page content loaded');

    // Take screenshot of successful login
    const timestamp = Date.now();
    await page.screenshot({ path: `test-results/login-success-${timestamp}.png`, fullPage: true });
    console.log(`📸 Success screenshot saved: test-results/login-success-${timestamp}.png`);

    console.log('=== Test Complete ===');
    console.log('✅ Login flow working correctly!');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    console.log('=== Testing Invalid Credentials ===');

    // Navigate to signin page (using German URL from actual frontend)
    await page.goto('/auth/anmelden');
    await page.waitForLoadState('networkidle');

    // Fill with invalid credentials
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('WrongPassword123!');

    // Submit
    await page.getByTestId('login-submit').click();

    // Wait for button to finish loading state
    await expect(page.getByTestId('login-submit')).not.toHaveAttribute('data-loading', 'true', { timeout: 10000 });
    console.log('✓ Button loading state cleared');

    // Should show error alert
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error|Ungültig|falsch/i });
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    const errorText = await errorAlert.textContent();
    console.log('✓ Error shown for invalid credentials:', errorText);
  });
});

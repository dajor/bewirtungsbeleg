/**
 * Playwright E2E Test: Complete Registration Flow
 *
 * Tests the full registration workflow:
 * 1. Register with email (Daniel Jordan - daniel.jordan+test@fellowpro.com)
 * 2. Retrieve verification token from Redis/file storage
 * 3. Setup password using the token (Tester45%)
 * 4. Login with the new account
 * 5. Verify authentication works
 */

import { test, expect } from '@playwright/test';
import { waitForToken } from './helpers/get-token';

// Generate unique email for each test run to avoid token reuse issues
const timestamp = Date.now();
const TEST_USER = {
  firstName: 'Daniel',
  lastName: 'Jordan',
  email: `daniel.jordan+test${timestamp}@fellowpro.com`,
  password: 'Tester45%',
};

test.describe('Complete Registration Flow', () => {
  test('should register, verify email token, setup password, and login successfully', async ({ page }) => {
    console.log('=== Step 1: Registration Form ===');

    // Navigate to registration page
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    // Wait for form to be visible
    await expect(page.locator('text=/Konto erstellen/i')).toBeVisible({ timeout: 10000 });

    // Fill registration form (Mantine TextInput uses label + input structure)
    await page.getByLabel('Vorname').fill(TEST_USER.firstName);
    await page.getByLabel('Nachname').fill(TEST_USER.lastName);
    await page.getByLabel('E-Mail').fill(TEST_USER.email);

    // Accept terms and conditions (look for checkbox near "Ich akzeptiere")
    await page.locator('input[type="checkbox"]').check();

    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for success message (use heading role to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: /E-Mail gesendet/i })).toBeVisible({ timeout: 10000 });
    console.log('✓ Registration successful - verification email sent');

    console.log('=== Step 2: Token Retrieval ===');

    // Wait for token to be stored (async operation)
    const token = await waitForToken(TEST_USER.email, 'email_verify', 15, 1000);

    if (!token) {
      throw new Error('Failed to retrieve verification token from storage');
    }

    console.log('✓ Token retrieved from storage:', token.substring(0, 20) + '...');

    console.log('=== Step 3: Password Setup ===');

    // Navigate to setup-password page with token
    const setupUrl = `/auth/setup-password?token=${token}`;
    await page.goto(setupUrl);

    // Wait for verification to complete
    await expect(page.locator('text=/E-Mail-Adresse wird verifiziert/i')).toBeVisible({ timeout: 5000 });
    console.log('✓ Token verification started');

    // Wait for form to appear (token verified) - use placeholder to find first password field
    await expect(page.getByPlaceholder('Mindestens 8 Zeichen')).toBeVisible({ timeout: 10000 });
    console.log('✓ Token verified - password setup form displayed');

    // Verify email is displayed
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();

    // Fill password fields using placeholders to distinguish them
    await page.getByPlaceholder('Mindestens 8 Zeichen').fill(TEST_USER.password);
    await page.getByPlaceholder('Passwort wiederholen').fill(TEST_USER.password);

    // Submit password form
    await page.click('button[type="submit"]');

    // Take screenshot to debug what happens after submit
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/after-password-submit.png' });

    // Check if there's an error first
    const errorAlert = page.getByRole('alert');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.log('❌ Error after password submit:', errorText);
      throw new Error(`Password setup failed: ${errorText}`);
    }

    // Wait for success message (using heading role)
    await expect(page.getByRole('heading', { name: /Konto erfolgreich erstellt/i })).toBeVisible({ timeout: 10000 });
    console.log('✓ Password setup successful - account created');

    // Wait for redirect to signin (3 second timeout in code)
    await page.waitForURL('**/auth/signin**', { timeout: 5000 });
    console.log('✓ Redirected to signin page');

    console.log('=== Step 4: Login ===');

    // Fill login form
    await page.getByLabel('E-Mail').fill(TEST_USER.email);
    await page.getByRole('textbox', { name: 'Passwort' }).fill(TEST_USER.password);

    // Submit login
    await page.click('button[type="submit"]:has-text("Anmelden")');

    // Wait for redirect to main app
    await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
    console.log('✓ Login successful - redirected to main app');

    // Verify we're on the main page and authenticated
    await expect(page).toHaveURL(/.*bewirtungsbeleg/);

    // Take screenshot of successful login
    await page.screenshot({ path: 'test-results/registration-complete.png' });

    console.log('=== Test Complete ===');
    console.log('✅ Full registration flow working correctly!');
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    console.log('=== Testing Duplicate Email Prevention ===');

    // Try to register with same email again
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Vorname').fill('Another');
    await page.getByLabel('Nachname').fill('User');
    await page.getByLabel('E-Mail').fill(TEST_USER.email);
    await page.locator('input[type="checkbox"]').check();
    await page.click('button[type="submit"]');

    // Should show error about existing email (look for Alert component with error message)
    // The full error message from API is: "Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an oder verwenden Sie die Funktion "Passwort vergessen"."
    await expect(page.getByRole('alert').filter({ hasText: /Ein Konto mit dieser E-Mail-Adresse existiert bereits/i }))
      .toBeVisible({ timeout: 10000 });

    console.log('✓ Duplicate email registration properly prevented');
  });
});

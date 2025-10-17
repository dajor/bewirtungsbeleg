# Test info

- Name: playwright-register: Complete Registration Flow >> should register, verify email via webhook, setup password, and login successfully
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-1-register.spec.ts:30:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=/Konto erstellen/i')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=/Konto erstellen/i')

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-1-register.spec.ts:38:59
```

# Page snapshot

```yaml
- alert
- dialog:
  - heading "Build Error" [level=1]
  - paragraph: Failed to compile
  - text: Next.js (14.2.29) is outdated
  - link "(learn more)":
    - /url: https://nextjs.org/docs/messages/version-staleness
  - link "./src/lib/opensearch.ts:8:1":
    - text: ./src/lib/opensearch.ts:8:1
    - img
  - text: "Module not found: Can't resolve '@opensearch-project/opensearch' 6 | */ 7 | > 8 | import { Client } from '@opensearch-project/opensearch'; | ^ 9 | // AWS Sigv4 Signer requires aws-sdk v2, which conflicts with our AWS SDK v3 usage 10 | // If you need AWS OpenSearch, install aws-sdk separately or use basic auth 11 | // import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
  - text: "Import trace for requested module:"
  - link "./src/middleware/ensure-user-index.ts":
    - text: ./src/middleware/ensure-user-index.ts
    - img
  - link "./src/lib/auth.ts":
    - text: ./src/lib/auth.ts
    - img
  - link "./src/app/api/auth/[...nextauth]/route.ts":
    - text: ./src/app/api/auth/[...nextauth]/route.ts
    - img
  - contentinfo:
    - paragraph: This error occurred during the build process and can only be dismissed by fixing the error.
```

# Test source

```ts
   1 | /**
   2 |  * Playwright E2E Test: Complete Registration Flow with Webhook
   3 |  *
   4 |  * Tests the full registration workflow using MailerSend webhook:
   5 |  * 1. Register with test email (Test Tester - uzylloqimwnkvwjfufeq@inbound.mailersend.net)
   6 |  * 2. Wait for email via webhook
   7 |  * 3. Extract verification link from email
   8 |  * 4. Setup password (Tester45%)
   9 |  * 5. Auto-login to /bewirtungsbeleg
   10 |  * 6. Logout for next test
   11 |  */
   12 |
   13 | import { test, expect } from '@playwright/test';
   14 | import { waitForWebhookEmail, extractVerificationLink, clearWebhookEmails } from './helpers/webhook-email';
   15 |
   16 | // Test user data as specified by user
   17 | const TEST_USER = {
   18 |   firstName: 'Test',
   19 |   lastName: 'Tester',
   20 |   email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
   21 |   password: 'Tester45%',
   22 | };
   23 |
   24 | test.describe('playwright-register: Complete Registration Flow', () => {
   25 |   // Clear webhook emails before test
   26 |   test.beforeEach(async () => {
   27 |     await clearWebhookEmails();
   28 |   });
   29 |
   30 |   test('should register, verify email via webhook, setup password, and login successfully', async ({ page }) => {
   31 |     console.log('=== Step 1: Registration Form ===');
   32 |
   33 |     // Navigate to registration page (using German URL from actual frontend)
   34 |     await page.goto('/auth/registrieren');
   35 |     await page.waitForLoadState('networkidle');
   36 |
   37 |     // Wait for form to be visible
>  38 |     await expect(page.locator('text=/Konto erstellen/i')).toBeVisible({ timeout: 10000 });
      |                                                           ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   39 |
   40 |     // Fill registration form using data-testid selectors
   41 |     await page.getByTestId('register-firstName').fill(TEST_USER.firstName);
   42 |     await page.getByTestId('register-lastName').fill(TEST_USER.lastName);
   43 |     await page.getByTestId('register-email').fill(TEST_USER.email);
   44 |
   45 |     // Accept terms and conditions
   46 |     await page.getByTestId('register-acceptTerms').check();
   47 |
   48 |     // Submit registration
   49 |     await page.getByTestId('register-submit').click();
   50 |
   51 |     // Wait for button to finish loading state
   52 |     await expect(page.getByTestId('register-submit')).not.toHaveAttribute('data-loading', 'true', { timeout: 10000 });
   53 |     console.log('✓ Button loading state cleared');
   54 |
   55 |     // Check if we got success or error (duplicate email)
   56 |     const successHeading = page.getByRole('heading', { name: /E-Mail gesendet/i });
   57 |     const errorAlert = page.locator('[role="alert"]').filter({ hasText: /existiert bereits|bereits registriert|Bestätigungslink/i });
   58 |
   59 |     // Wait for either success or duplicate error
   60 |     try {
   61 |       await expect(successHeading).toBeVisible({ timeout: 5000 });
   62 |       console.log('✓ Registration successful - verification email sent');
   63 |     } catch (e) {
   64 |       // Check if it's a duplicate email error
   65 |       const isDuplicateError = await errorAlert.isVisible();
   66 |       if (isDuplicateError) {
   67 |         const errorText = await errorAlert.textContent();
   68 |         console.log('⚠️  User already exists:', errorText);
   69 |         console.log('⚠️  Skipping to login test - assuming user is already registered');
   70 |
   71 |         // Skip the rest of registration flow
   72 |         // The login test will handle authentication
   73 |         return;
   74 |       }
   75 |       // If not duplicate error, re-throw
   76 |       throw e;
   77 |     }
   78 |
   79 |     console.log('=== Step 2: Wait for Email via Webhook ===');
   80 |
   81 |     // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
   82 |     const email = await waitForWebhookEmail(TEST_USER.email, 30, 1000);
   83 |
   84 |     if (!email) {
   85 |       throw new Error('Failed to receive verification email via webhook. Check MailerSend webhook configuration.');
   86 |     }
   87 |
   88 |     console.log('✓ Email received via webhook:', email.subject);
   89 |
   90 |     // Extract verification link
   91 |     const verificationLink = extractVerificationLink(email);
   92 |
   93 |     if (!verificationLink) {
   94 |       throw new Error('Failed to extract verification link from email');
   95 |     }
   96 |
   97 |     console.log('✓ Verification link extracted:', verificationLink.substring(0, 60) + '...');
   98 |
   99 |     console.log('=== Step 3: Password Setup ===');
  100 |
  101 |     // Navigate to verification link
  102 |     await page.goto(verificationLink);
  103 |
  104 |     // Wait for verification to complete
  105 |     await expect(page.locator('text=/E-Mail-Adresse wird verifiziert/i')).toBeVisible({ timeout: 5000 });
  106 |     console.log('✓ Token verification started');
  107 |
  108 |     // Wait for password setup form to appear
  109 |     await expect(page.getByTestId('setup-password')).toBeVisible({ timeout: 10000 });
  110 |     console.log('✓ Token verified - password setup form displayed');
  111 |
  112 |     // Verify email is displayed
  113 |     await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  114 |
  115 |     // Fill password fields using data-testid
  116 |     await page.getByTestId('setup-password').fill(TEST_USER.password);
  117 |     await page.getByTestId('setup-confirmPassword').fill(TEST_USER.password);
  118 |
  119 |     // Submit password form
  120 |     await page.getByTestId('setup-submit').click();
  121 |
  122 |     // Wait for password setup success message
  123 |     const passwordSuccessHeading = page.getByRole('heading', { name: /Konto erfolgreich erstellt/i });
  124 |     const passwordErrorAlert = page.locator('[role="alert"]').filter({ has: page.locator('text=/Fehler|Error/i') });
  125 |
  126 |     try {
  127 |       await expect(passwordSuccessHeading).toBeVisible({ timeout: 10000 });
  128 |       console.log('✓ Password setup successful - account created');
  129 |     } catch (e) {
  130 |       // Take screenshot on error
  131 |       const timestamp = Date.now();
  132 |       await page.screenshot({ path: `test-results/password-setup-error-${timestamp}.png`, fullPage: true });
  133 |       console.log(`📸 Screenshot saved: test-results/password-setup-error-${timestamp}.png`);
  134 |
  135 |       // Check if there's an error
  136 |       const isErrorVisible = await passwordErrorAlert.isVisible();
  137 |       if (isErrorVisible) {
  138 |         const errorText = await passwordErrorAlert.textContent();
```
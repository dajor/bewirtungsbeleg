# Test info

- Name: playwright-password-reset: Complete Password Reset Flow >> should reset password, auto-login, then restore original password
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-3-password-reset.spec.ts:41:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=/Passwort vergessen/i')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=/Passwort vergessen/i')

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-3-password-reset.spec.ts:57:62
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
   2 |  * Playwright E2E Test: Complete Password Reset Flow with Webhook
   3 |  *
   4 |  * Tests the full password reset workflow using MailerSend webhook:
   5 |  * 1. Navigate to forgot password page
   6 |  * 2. Submit test email for password reset
   7 |  * 3. Wait for reset email via webhook
   8 |  * 4. Extract reset link from email
   9 |  * 5. Navigate to reset link and set new password
   10 |  * 6. Auto-login with new password
   11 |  * 7. Verify redirect to /bewirtungsbeleg
   12 |  * 8. Logout and reset password back to original
   13 |  * 9. Login again to confirm original password restored
   14 |  *
   15 |  * Webhook Configuration:
   16 |  * - Inbound Email: yzwmdjgob38u0x4txzzv@inbound.mailersend.net
   17 |  * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/password-forget
   18 |  * - Secret: LTgupNfVt0ibdUnv8DT3SPeaEE1oRUT4
   19 |  */
   20 |
   21 | import { test, expect } from '@playwright/test';
   22 | import {
   23 |   waitForPasswordResetEmail,
   24 |   extractPasswordResetLink,
   25 |   clearWebhookEmails
   26 | } from './helpers/webhook-email';
   27 |
   28 | // Test user data (existing user from registration test)
   29 | const TEST_USER = {
   30 |   email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
   31 |   currentPassword: 'Tester45%',
   32 |   newPassword: 'NewTester45%',
   33 | };
   34 |
   35 | test.describe('playwright-password-reset: Complete Password Reset Flow', () => {
   36 |   // Clear webhook emails before test
   37 |   test.beforeEach(async () => {
   38 |     await clearWebhookEmails(undefined, 'password-forget');
   39 |   });
   40 |
   41 |   test('should reset password, auto-login, then restore original password', async ({ page }) => {
   42 |     console.log('=== Step 1: Request Password Reset ===');
   43 |
   44 |     // Navigate to forgot password page (using German URL from actual frontend)
   45 |     await page.goto('/auth/passwort-vergessen');
   46 |     await page.waitForLoadState('networkidle');
   47 |
   48 |     // Take screenshot of forgot password form
   49 |     const timestamp1 = Date.now();
   50 |     await page.screenshot({
   51 |       path: `test-results/password-reset-form-${timestamp1}.png`,
   52 |       fullPage: true
   53 |     });
   54 |     console.log(`📸 Screenshot saved: test-results/password-reset-form-${timestamp1}.png`);
   55 |
   56 |     // Wait for form to be visible
>  57 |     await expect(page.locator('text=/Passwort vergessen/i')).toBeVisible({ timeout: 10000 });
      |                                                              ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   58 |
   59 |     // Fill email and submit
   60 |     await page.getByTestId('forgot-password-email').fill(TEST_USER.email);
   61 |     await page.getByTestId('forgot-password-submit').click();
   62 |
   63 |     // Wait for success message
   64 |     try {
   65 |       await expect(page.getByTestId('forgot-password-success')).toBeVisible({ timeout: 10000 });
   66 |       console.log('✓ Password reset email requested - success message displayed');
   67 |
   68 |       // Take screenshot of success
   69 |       const timestamp2 = Date.now();
   70 |       await page.screenshot({
   71 |         path: `test-results/password-reset-email-sent-${timestamp2}.png`,
   72 |         fullPage: true
   73 |       });
   74 |       console.log(`📸 Screenshot saved: test-results/password-reset-email-sent-${timestamp2}.png`);
   75 |     } catch (e) {
   76 |       // Take error screenshot
   77 |       const timestamp = Date.now();
   78 |       await page.screenshot({
   79 |         path: `test-results/password-reset-request-error-${timestamp}.png`,
   80 |         fullPage: true
   81 |       });
   82 |       console.log(`📸 Error screenshot saved: test-results/password-reset-request-error-${timestamp}.png`);
   83 |       throw e;
   84 |     }
   85 |
   86 |     console.log('=== Step 2: Wait for Reset Email via Webhook ===');
   87 |
   88 |     // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
   89 |     const email = await waitForPasswordResetEmail(TEST_USER.email, 30, 1000);
   90 |
   91 |     if (!email) {
   92 |       throw new Error('Failed to receive password reset email via webhook. Check MailerSend webhook configuration.');
   93 |     }
   94 |
   95 |     console.log('✓ Password reset email received via webhook:', email.subject);
   96 |
   97 |     // Extract reset link
   98 |     const resetLink = extractPasswordResetLink(email);
   99 |
  100 |     if (!resetLink) {
  101 |       throw new Error('Failed to extract reset link from email');
  102 |     }
  103 |
  104 |     console.log('✓ Reset link extracted:', resetLink.substring(0, 60) + '...');
  105 |
  106 |     console.log('=== Step 3: Navigate to Reset Link and Set New Password ===');
  107 |
  108 |     // Navigate to reset link
  109 |     await page.goto(resetLink);
  110 |     await page.waitForLoadState('networkidle');
  111 |
  112 |     // Wait for reset password form
  113 |     await expect(page.locator('text=/Passwort zurücksetzen/i')).toBeVisible({ timeout: 10000 });
  114 |     console.log('✓ Reset password form displayed');
  115 |
  116 |     // Take screenshot of reset form
  117 |     const timestamp3 = Date.now();
  118 |     await page.screenshot({
  119 |       path: `test-results/password-reset-new-password-form-${timestamp3}.png`,
  120 |       fullPage: true
  121 |     });
  122 |     console.log(`📸 Screenshot saved: test-results/password-reset-new-password-form-${timestamp3}.png`);
  123 |
  124 |     // Fill new password
  125 |     await page.getByTestId('reset-password-password').fill(TEST_USER.newPassword);
  126 |     await page.getByTestId('reset-password-confirmPassword').fill(TEST_USER.newPassword);
  127 |
  128 |     // Submit password form
  129 |     await page.getByTestId('reset-password-submit').click();
  130 |
  131 |     // Wait for success message
  132 |     try {
  133 |       await expect(page.getByTestId('reset-password-success')).toBeVisible({ timeout: 10000 });
  134 |       console.log('✓ Password reset successful - success message displayed');
  135 |
  136 |       // Take screenshot of success
  137 |       const timestamp4 = Date.now();
  138 |       await page.screenshot({
  139 |         path: `test-results/password-reset-success-${timestamp4}.png`,
  140 |         fullPage: true
  141 |       });
  142 |       console.log(`📸 Screenshot saved: test-results/password-reset-success-${timestamp4}.png`);
  143 |     } catch (e) {
  144 |       // Take error screenshot
  145 |       const timestamp = Date.now();
  146 |       await page.screenshot({
  147 |         path: `test-results/password-reset-error-${timestamp}.png`,
  148 |         fullPage: true
  149 |       });
  150 |       console.log(`📸 Error screenshot saved: test-results/password-reset-error-${timestamp}.png`);
  151 |       throw e;
  152 |     }
  153 |
  154 |     console.log('=== Step 4: Verify Auto-Login & Redirect ===');
  155 |
  156 |     // Wait for auto-redirect to main app (password reset page auto-logs in)
  157 |     await page.waitForURL('**/bewirtungsbeleg**', { timeout: 15000 });
```
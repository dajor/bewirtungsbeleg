# Test info

- Name: playwright-magic-link: Complete Magic Link Authentication Flow >> should request magic link, receive email, and auto-login successfully
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-4-magic-link.spec.ts:39:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('text=/Anmelden|Einloggen/i').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=/Anmelden|Einloggen/i').first()

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-4-magic-link.spec.ts:46:70
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
   2 |  * Playwright E2E Test: Complete Magic Link Authentication Flow with Webhook
   3 |  *
   4 |  * Tests the full magic link (passwordless) authentication workflow using MailerSend webhook:
   5 |  * 1. Navigate to signin page
   6 |  * 2. Switch to magic link mode
   7 |  * 3. Submit test email for magic link
   8 |  * 4. Verify countdown timer appears
   9 |  * 5. Wait for magic link email via webhook
   10 |  * 6. Extract magic link from email
   11 |  * 7. Navigate to magic link
   12 |  * 8. Verify auto-login and redirect to /bewirtungsbeleg
   13 |  * 9. Logout for cleanup
   14 |  *
   15 |  * Webhook Configuration:
   16 |  * - Inbound Email: hub1q1enbohud95ctosh@inbound.mailersend.net
   17 |  * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/magic-link
   18 |  * - Secret: Rbv4DdNeYzMkfxi2K11vJHYFNhlMiCcB
   19 |  */
   20 |
   21 | import { test, expect } from '@playwright/test';
   22 | import {
   23 |   waitForMagicLinkEmail,
   24 |   extractMagicLink,
   25 |   clearWebhookEmails
   26 | } from './helpers/webhook-email';
   27 |
   28 | // Test user data (existing user from registration test)
   29 | const TEST_USER = {
   30 |   email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
   31 | };
   32 |
   33 | test.describe('playwright-magic-link: Complete Magic Link Authentication Flow', () => {
   34 |   // Clear webhook emails before test
   35 |   test.beforeEach(async () => {
   36 |     await clearWebhookEmails(undefined, 'magic-link');
   37 |   });
   38 |
   39 |   test('should request magic link, receive email, and auto-login successfully', async ({ page }) => {
   40 |     console.log('=== Step 1: Navigate to Signin Page ===');
   41 |
   42 |     await page.goto('/auth/signin');
   43 |     await page.waitForLoadState('networkidle');
   44 |
   45 |     // Wait for signin page to load
>  46 |     await expect(page.locator('text=/Anmelden|Einloggen/i').first()).toBeVisible({ timeout: 10000 });
      |                                                                      ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   47 |     console.log('✓ Signin page loaded');
   48 |
   49 |     // Take screenshot of signin form
   50 |     const timestamp1 = Date.now();
   51 |     await page.screenshot({
   52 |       path: `test-results/magic-link-signin-form-${timestamp1}.png`,
   53 |       fullPage: true
   54 |     });
   55 |     console.log(`📸 Screenshot saved: test-results/magic-link-signin-form-${timestamp1}.png`);
   56 |
   57 |     console.log('=== Step 2: Switch to Magic Link Mode ===');
   58 |
   59 |     // Find and click the login mode toggle
   60 |     const toggleButton = page.getByTestId('login-mode-toggle');
   61 |     await expect(toggleButton).toBeVisible({ timeout: 10000 });
   62 |     await toggleButton.click();
   63 |
   64 |     console.log('✓ Clicked login mode toggle');
   65 |
   66 |     // Wait for magic link mode to activate (password field should disappear)
   67 |     await page.waitForTimeout(500); // Small delay for UI transition
   68 |
   69 |     // Verify we're in magic link mode (no password field visible)
   70 |     const passwordField = page.getByTestId('login-password');
   71 |     try {
   72 |       await expect(passwordField).not.toBeVisible({ timeout: 2000 });
   73 |       console.log('✓ Switched to magic link mode (password field hidden)');
   74 |     } catch (e) {
   75 |       console.log('⚠️  Password field still visible, but continuing...');
   76 |     }
   77 |
   78 |     // Take screenshot of magic link mode
   79 |     const timestamp2 = Date.now();
   80 |     await page.screenshot({
   81 |       path: `test-results/magic-link-mode-active-${timestamp2}.png`,
   82 |       fullPage: true
   83 |     });
   84 |     console.log(`📸 Screenshot saved: test-results/magic-link-mode-active-${timestamp2}.png`);
   85 |
   86 |     console.log('=== Step 3: Request Magic Link ===');
   87 |
   88 |     // Fill email
   89 |     await page.getByTestId('login-email').fill(TEST_USER.email);
   90 |     console.log('✓ Email filled');
   91 |
   92 |     // Submit form
   93 |     await page.getByTestId('login-submit').click();
   94 |     console.log('✓ Form submitted');
   95 |
   96 |     console.log('=== Step 4: Verify Countdown Timer ===');
   97 |
   98 |     // Wait for countdown timer or success message to appear
   99 |     try {
  100 |       // Look for either countdown or success message
  101 |       const countdownOrSuccess = page.locator('text=/wird gesendet|gesendet|countdown|sekunden|100/i');
  102 |       await expect(countdownOrSuccess.first()).toBeVisible({ timeout: 10000 });
  103 |       console.log('✓ Magic link request acknowledged (countdown or success message visible)');
  104 |
  105 |       // Take screenshot of confirmation
  106 |       const timestamp3 = Date.now();
  107 |       await page.screenshot({
  108 |         path: `test-results/magic-link-email-sent-${timestamp3}.png`,
  109 |         fullPage: true
  110 |       });
  111 |       console.log(`📸 Screenshot saved: test-results/magic-link-email-sent-${timestamp3}.png`);
  112 |     } catch (e) {
  113 |       // Take error screenshot
  114 |       const timestamp = Date.now();
  115 |       await page.screenshot({
  116 |         path: `test-results/magic-link-request-error-${timestamp}.png`,
  117 |         fullPage: true
  118 |       });
  119 |       console.log(`📸 Error screenshot saved: test-results/magic-link-request-error-${timestamp}.png`);
  120 |       throw new Error('Failed to confirm magic link request - no countdown or success message visible');
  121 |     }
  122 |
  123 |     console.log('=== Step 5: Wait for Magic Link Email via Webhook ===');
  124 |
  125 |     // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
  126 |     const email = await waitForMagicLinkEmail(TEST_USER.email, 30, 1000);
  127 |
  128 |     if (!email) {
  129 |       throw new Error('Failed to receive magic link email via webhook. Check MailerSend webhook configuration.');
  130 |     }
  131 |
  132 |     console.log('✓ Magic link email received via webhook:', email.subject);
  133 |
  134 |     // Extract magic link
  135 |     const magicLink = extractMagicLink(email);
  136 |
  137 |     if (!magicLink) {
  138 |       throw new Error('Failed to extract magic link from email');
  139 |     }
  140 |
  141 |     console.log('✓ Magic link extracted:', magicLink.substring(0, 60) + '...');
  142 |
  143 |     console.log('=== Step 6: Navigate to Magic Link ===');
  144 |
  145 |     // Navigate to magic link
  146 |     await page.goto(magicLink);
```
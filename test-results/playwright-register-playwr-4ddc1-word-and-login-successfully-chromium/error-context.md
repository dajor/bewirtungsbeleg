# Test info

- Name: playwright-register: Complete Registration Flow >> should register, verify email via webhook, setup password, and login successfully
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-register.spec.ts:30:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('heading', { name: /E-Mail gesendet/i })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for getByRole('heading', { name: /E-Mail gesendet/i })

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-register.spec.ts:52:75
```

# Page snapshot

```yaml
- banner:
  - link "DocBits":
    - /url: /
    - img "DocBits"
  - link "Beleg erstellen":
    - /url: /bewirtungsbeleg
  - link "Features":
    - /url: /#features
  - link "GoBD":
    - /url: /gobd
  - link "Release Notes":
    - /url: /release-notes
  - button "Lädt..." [disabled]
- main:
  - link "DocBits":
    - /url: /
    - img "DocBits"
  - heading "Konto erstellen" [level=2]
  - paragraph: Erstellen Sie ein kostenloses Konto
  - text: Vorname
  - textbox "Vorname"
  - text: Nachname
  - textbox "Nachname"
  - text: E-Mail
  - textbox "E-Mail"
  - paragraph: Sie erhalten eine E-Mail mit einem Link zum Erstellen Ihres Passworts.
  - checkbox "Ich akzeptiere die AGB und Datenschutzbestimmungen"
  - paragraph:
    - text: Ich akzeptiere die
    - link "AGB":
      - /url: /terms
    - text: und
    - link "Datenschutzbestimmungen":
      - /url: /privacy
  - button "Registrieren"
  - separator: oder
  - paragraph:
    - text: Haben Sie bereits ein Konto?
    - link "Jetzt anmelden":
      - /url: /auth/signin
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
   33 |     // Navigate to registration page
   34 |     await page.goto('/auth/register');
   35 |     await page.waitForLoadState('networkidle');
   36 |
   37 |     // Wait for form to be visible
   38 |     await expect(page.locator('text=/Konto erstellen/i')).toBeVisible({ timeout: 10000 });
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
   51 |     // Wait for success message
>  52 |     await expect(page.getByRole('heading', { name: /E-Mail gesendet/i })).toBeVisible({ timeout: 10000 });
      |                                                                           ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   53 |     console.log('✓ Registration successful - verification email sent');
   54 |
   55 |     console.log('=== Step 2: Wait for Email via Webhook ===');
   56 |
   57 |     // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
   58 |     const email = await waitForWebhookEmail(TEST_USER.email, 30, 1000);
   59 |
   60 |     if (!email) {
   61 |       throw new Error('Failed to receive verification email via webhook. Check MailerSend webhook configuration.');
   62 |     }
   63 |
   64 |     console.log('✓ Email received via webhook:', email.subject);
   65 |
   66 |     // Extract verification link
   67 |     const verificationLink = extractVerificationLink(email);
   68 |
   69 |     if (!verificationLink) {
   70 |       throw new Error('Failed to extract verification link from email');
   71 |     }
   72 |
   73 |     console.log('✓ Verification link extracted:', verificationLink.substring(0, 60) + '...');
   74 |
   75 |     console.log('=== Step 3: Password Setup ===');
   76 |
   77 |     // Navigate to verification link
   78 |     await page.goto(verificationLink);
   79 |
   80 |     // Wait for verification to complete
   81 |     await expect(page.locator('text=/E-Mail-Adresse wird verifiziert/i')).toBeVisible({ timeout: 5000 });
   82 |     console.log('✓ Token verification started');
   83 |
   84 |     // Wait for password setup form to appear
   85 |     await expect(page.getByTestId('setup-password')).toBeVisible({ timeout: 10000 });
   86 |     console.log('✓ Token verified - password setup form displayed');
   87 |
   88 |     // Verify email is displayed
   89 |     await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
   90 |
   91 |     // Fill password fields using data-testid
   92 |     await page.getByTestId('setup-password').fill(TEST_USER.password);
   93 |     await page.getByTestId('setup-confirmPassword').fill(TEST_USER.password);
   94 |
   95 |     // Submit password form
   96 |     await page.getByTestId('setup-submit').click();
   97 |
   98 |     // Wait for success message
   99 |     const successHeading = page.getByRole('heading', { name: /Konto erfolgreich erstellt/i });
  100 |     const errorAlert = page.locator('[role="alert"]').filter({ has: page.locator('text=/Fehler|Error/i') });
  101 |
  102 |     try {
  103 |       await expect(successHeading).toBeVisible({ timeout: 10000 });
  104 |       console.log('✓ Password setup successful - account created');
  105 |     } catch (e) {
  106 |       // Take screenshot on error
  107 |       const timestamp = Date.now();
  108 |       await page.screenshot({ path: `test-results/password-setup-error-${timestamp}.png`, fullPage: true });
  109 |       console.log(`📸 Screenshot saved: test-results/password-setup-error-${timestamp}.png`);
  110 |
  111 |       // Check if there's an error
  112 |       const isErrorVisible = await errorAlert.isVisible();
  113 |       if (isErrorVisible) {
  114 |         const errorText = await errorAlert.textContent();
  115 |         console.log('❌ Error after password submit:', errorText);
  116 |         throw new Error(`Password setup failed: ${errorText}`);
  117 |       }
  118 |       throw e;
  119 |     }
  120 |
  121 |     console.log('=== Step 4: Auto-Login & Redirect ===');
  122 |
  123 |     // Wait for auto-redirect to main app
  124 |     await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
  125 |     console.log('✓ Auto-login successful - redirected to /bewirtungsbeleg');
  126 |
  127 |     // Verify we're on the main page
  128 |     await expect(page).toHaveURL(/.*bewirtungsbeleg/);
  129 |
  130 |     // Take screenshot of successful registration
  131 |     const timestamp = Date.now();
  132 |     await page.screenshot({ path: `test-results/registration-complete-${timestamp}.png`, fullPage: true });
  133 |     console.log(`📸 Success screenshot saved: test-results/registration-complete-${timestamp}.png`);
  134 |
  135 |     console.log('=== Step 5: Logout for Next Test ===');
  136 |
  137 |     // TODO: Implement logout logic when user menu is available
  138 |     // For now, just clear cookies and session
  139 |     await page.context().clearCookies();
  140 |     console.log('✓ Logged out (cookies cleared)');
  141 |
  142 |     console.log('=== Test Complete ===');
  143 |     console.log('✅ Full registration flow with webhook working correctly!');
  144 |   });
  145 | });
  146 |
```
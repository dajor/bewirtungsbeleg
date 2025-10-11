# Test info

- Name: playwright-register: Complete Registration Flow >> should register, verify email via webhook, setup password, and login successfully
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-1-register.spec.ts:30:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('heading', { name: /E-Mail gesendet/i })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('heading', { name: /E-Mail gesendet/i })

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-1-register.spec.ts:57:36
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
   51 |     // Check if we got success or error (duplicate email)
   52 |     const successHeading = page.getByRole('heading', { name: /E-Mail gesendet/i });
   53 |     const errorAlert = page.locator('[role="alert"]').filter({ hasText: /existiert bereits|bereits registriert/i });
   54 |
   55 |     // Wait for either success or duplicate error
   56 |     try {
>  57 |       await expect(successHeading).toBeVisible({ timeout: 5000 });
      |                                    ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   58 |       console.log('✓ Registration successful - verification email sent');
   59 |     } catch (e) {
   60 |       // Check if it's a duplicate email error
   61 |       const isDuplicateError = await errorAlert.isVisible();
   62 |       if (isDuplicateError) {
   63 |         const errorText = await errorAlert.textContent();
   64 |         console.log('⚠️  User already exists:', errorText);
   65 |         console.log('⚠️  Skipping to login test - assuming user is already registered');
   66 |
   67 |         // Skip the rest of registration flow
   68 |         // The login test will handle authentication
   69 |         return;
   70 |       }
   71 |       // If not duplicate error, re-throw
   72 |       throw e;
   73 |     }
   74 |
   75 |     console.log('=== Step 2: Wait for Email via Webhook ===');
   76 |
   77 |     // Wait for email to arrive via webhook (30 attempts, 1 second each = 30 seconds max)
   78 |     const email = await waitForWebhookEmail(TEST_USER.email, 30, 1000);
   79 |
   80 |     if (!email) {
   81 |       throw new Error('Failed to receive verification email via webhook. Check MailerSend webhook configuration.');
   82 |     }
   83 |
   84 |     console.log('✓ Email received via webhook:', email.subject);
   85 |
   86 |     // Extract verification link
   87 |     const verificationLink = extractVerificationLink(email);
   88 |
   89 |     if (!verificationLink) {
   90 |       throw new Error('Failed to extract verification link from email');
   91 |     }
   92 |
   93 |     console.log('✓ Verification link extracted:', verificationLink.substring(0, 60) + '...');
   94 |
   95 |     console.log('=== Step 3: Password Setup ===');
   96 |
   97 |     // Navigate to verification link
   98 |     await page.goto(verificationLink);
   99 |
  100 |     // Wait for verification to complete
  101 |     await expect(page.locator('text=/E-Mail-Adresse wird verifiziert/i')).toBeVisible({ timeout: 5000 });
  102 |     console.log('✓ Token verification started');
  103 |
  104 |     // Wait for password setup form to appear
  105 |     await expect(page.getByTestId('setup-password')).toBeVisible({ timeout: 10000 });
  106 |     console.log('✓ Token verified - password setup form displayed');
  107 |
  108 |     // Verify email is displayed
  109 |     await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  110 |
  111 |     // Fill password fields using data-testid
  112 |     await page.getByTestId('setup-password').fill(TEST_USER.password);
  113 |     await page.getByTestId('setup-confirmPassword').fill(TEST_USER.password);
  114 |
  115 |     // Submit password form
  116 |     await page.getByTestId('setup-submit').click();
  117 |
  118 |     // Wait for password setup success message
  119 |     const passwordSuccessHeading = page.getByRole('heading', { name: /Konto erfolgreich erstellt/i });
  120 |     const passwordErrorAlert = page.locator('[role="alert"]').filter({ has: page.locator('text=/Fehler|Error/i') });
  121 |
  122 |     try {
  123 |       await expect(passwordSuccessHeading).toBeVisible({ timeout: 10000 });
  124 |       console.log('✓ Password setup successful - account created');
  125 |     } catch (e) {
  126 |       // Take screenshot on error
  127 |       const timestamp = Date.now();
  128 |       await page.screenshot({ path: `test-results/password-setup-error-${timestamp}.png`, fullPage: true });
  129 |       console.log(`📸 Screenshot saved: test-results/password-setup-error-${timestamp}.png`);
  130 |
  131 |       // Check if there's an error
  132 |       const isErrorVisible = await passwordErrorAlert.isVisible();
  133 |       if (isErrorVisible) {
  134 |         const errorText = await passwordErrorAlert.textContent();
  135 |         console.log('❌ Error after password submit:', errorText);
  136 |         throw new Error(`Password setup failed: ${errorText}`);
  137 |       }
  138 |       throw e;
  139 |     }
  140 |
  141 |     console.log('=== Step 4: Auto-Login & Redirect ===');
  142 |
  143 |     // Wait for auto-redirect to main app
  144 |     await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
  145 |     console.log('✓ Auto-login successful - redirected to /bewirtungsbeleg');
  146 |
  147 |     // Verify we're on the main page
  148 |     await expect(page).toHaveURL(/.*bewirtungsbeleg/);
  149 |
  150 |     // Take screenshot of successful registration
  151 |     const timestamp = Date.now();
  152 |     await page.screenshot({ path: `test-results/registration-complete-${timestamp}.png`, fullPage: true });
  153 |     console.log(`📸 Success screenshot saved: test-results/registration-complete-${timestamp}.png`);
  154 |
  155 |     console.log('=== Step 5: Logout for Next Test ===');
  156 |
  157 |     // TODO: Implement logout logic when user menu is available
```
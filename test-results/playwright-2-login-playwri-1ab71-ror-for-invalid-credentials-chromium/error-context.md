# Test info

- Name: playwright-login: Login Flow >> should show error for invalid credentials
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-2-login.spec.ts:96:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('[role="alert"]').filter({ hasText: /Fehler|Error|Ungültig/i })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('[role="alert"]').filter({ hasText: /Fehler|Error|Ungültig/i })

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-2-login.spec.ts:112:30
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
  - heading "Willkommen zurück" [level=2]
  - paragraph: Melden Sie sich an, um fortzufahren
  - radiogroup:
    - radio "Passwort" [checked]
    - img
    - text: Passwort
    - radio "Magischer Link"
    - img
    - text: Magischer Link
  - text: E-Mail
  - textbox "E-Mail"
  - text: Passwort
  - textbox "Passwort"
  - checkbox "Angemeldet bleiben" [checked]
  - text: Angemeldet bleiben
  - link "Passwort vergessen?":
    - /url: /auth/forgot-password
  - button "Anmelden"
  - paragraph:
    - text: Noch kein Konto?
    - link "Jetzt registrieren":
      - /url: /auth/register
```

# Test source

```ts
   12 |
   13 | import { test, expect } from '@playwright/test';
   14 |
   15 | // Same test user data from playwright-register
   16 | const TEST_USER = {
   17 |   email: 'uzylloqimwnkvwjfufeq@inbound.mailersend.net',
   18 |   password: 'Tester45%',
   19 | };
   20 |
   21 | test.describe('playwright-login: Login Flow', () => {
   22 |   test('should login with existing credentials and redirect to main app', async ({ page }) => {
   23 |     console.log('=== Step 1: Navigate to Signin Page ===');
   24 |
   25 |     // Navigate to signin page
   26 |     await page.goto('/auth/signin');
   27 |     await page.waitForLoadState('networkidle');
   28 |
   29 |     // Wait for form to be visible
   30 |     await expect(page.locator('text=/Willkommen zurück/i')).toBeVisible({ timeout: 10000 });
   31 |     console.log('✓ Signin page loaded');
   32 |
   33 |     // Verify we're in password mode (default)
   34 |     await expect(page.getByTestId('login-email')).toBeVisible();
   35 |     await expect(page.getByTestId('login-password')).toBeVisible();
   36 |     console.log('✓ Password mode is active');
   37 |
   38 |     console.log('=== Step 2: Fill Login Form ===');
   39 |
   40 |     // Fill email field
   41 |     await page.getByTestId('login-email').fill(TEST_USER.email);
   42 |     console.log('✓ Email filled:', TEST_USER.email);
   43 |
   44 |     // Fill password field
   45 |     await page.getByTestId('login-password').fill(TEST_USER.password);
   46 |     console.log('✓ Password filled');
   47 |
   48 |     console.log('=== Step 3: Submit Login ===');
   49 |
   50 |     // Submit login form
   51 |     await page.getByTestId('login-submit').click();
   52 |
   53 |     // Wait for redirect to main app
   54 |     try {
   55 |       await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
   56 |       console.log('✓ Login successful - redirected to /bewirtungsbeleg');
   57 |     } catch (e) {
   58 |       // Take screenshot on error
   59 |       const timestamp = Date.now();
   60 |       await page.screenshot({ path: `test-results/login-error-${timestamp}.png`, fullPage: true });
   61 |       console.log(`📸 Screenshot saved: test-results/login-error-${timestamp}.png`);
   62 |
   63 |       // Check if there's an error alert
   64 |       const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error/i });
   65 |       const isErrorVisible = await errorAlert.isVisible();
   66 |
   67 |       if (isErrorVisible) {
   68 |         const errorText = await errorAlert.textContent();
   69 |         console.log('❌ Login error:', errorText);
   70 |         throw new Error(`Login failed: ${errorText}`);
   71 |       }
   72 |
   73 |       throw new Error('Login failed: Did not redirect to /bewirtungsbeleg');
   74 |     }
   75 |
   76 |     console.log('=== Step 4: Verify Authentication ===');
   77 |
   78 |     // Verify we're on the main page
   79 |     await expect(page).toHaveURL(/.*bewirtungsbeleg/);
   80 |     console.log('✓ URL verified: /bewirtungsbeleg');
   81 |
   82 |     // Verify page content is loaded (check for form or main content)
   83 |     // This ensures we're not just on the page but actually authenticated
   84 |     await expect(page.locator('body')).toBeVisible();
   85 |     console.log('✓ Page content loaded');
   86 |
   87 |     // Take screenshot of successful login
   88 |     const timestamp = Date.now();
   89 |     await page.screenshot({ path: `test-results/login-success-${timestamp}.png`, fullPage: true });
   90 |     console.log(`📸 Success screenshot saved: test-results/login-success-${timestamp}.png`);
   91 |
   92 |     console.log('=== Test Complete ===');
   93 |     console.log('✅ Login flow working correctly!');
   94 |   });
   95 |
   96 |   test('should show error for invalid credentials', async ({ page }) => {
   97 |     console.log('=== Testing Invalid Credentials ===');
   98 |
   99 |     // Navigate to signin page
  100 |     await page.goto('/auth/signin');
  101 |     await page.waitForLoadState('networkidle');
  102 |
  103 |     // Fill with invalid credentials
  104 |     await page.getByTestId('login-email').fill('invalid@example.com');
  105 |     await page.getByTestId('login-password').fill('WrongPassword123!');
  106 |
  107 |     // Submit
  108 |     await page.getByTestId('login-submit').click();
  109 |
  110 |     // Should show error alert
  111 |     const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error|Ungültig/i });
> 112 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
      |                              ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
  113 |
  114 |     const errorText = await errorAlert.textContent();
  115 |     console.log('✓ Error shown for invalid credentials:', errorText);
  116 |   });
  117 | });
  118 |
```
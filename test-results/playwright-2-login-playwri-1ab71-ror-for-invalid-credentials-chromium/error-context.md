# Test info

- Name: playwright-login: Login Flow >> should show error for invalid credentials
- Location: /Users/daniel/dev/Bewritung/bewir/test/playwright-2-login.spec.ts:100:3

# Error details

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByTestId('login-email')

    at /Users/daniel/dev/Bewritung/bewir/test/playwright-2-login.spec.ts:108:43
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
   8 |  * 4. Verify user is authenticated
   9 |  *
   10 |  * NOTE: This test depends on playwright-register.spec.ts completing successfully first!
   11 |  */
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
   25 |     // Navigate to signin page (using German URL from actual frontend)
   26 |     await page.goto('/auth/anmelden');
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
   53 |     // Wait for button to finish loading state (max 10 seconds)
   54 |     await expect(page.getByTestId('login-submit')).not.toHaveAttribute('data-loading', 'true', { timeout: 10000 });
   55 |     console.log('✓ Button loading state cleared');
   56 |
   57 |     // Wait for redirect to main app
   58 |     try {
   59 |       await page.waitForURL('**/bewirtungsbeleg**', { timeout: 10000 });
   60 |       console.log('✓ Login successful - redirected to /bewirtungsbeleg');
   61 |     } catch (e) {
   62 |       // Take screenshot on error
   63 |       const timestamp = Date.now();
   64 |       await page.screenshot({ path: `test-results/login-error-${timestamp}.png`, fullPage: true });
   65 |       console.log(`📸 Screenshot saved: test-results/login-error-${timestamp}.png`);
   66 |
   67 |       // Check if there's an error alert
   68 |       const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error|falsch/i });
   69 |       const isErrorVisible = await errorAlert.isVisible();
   70 |
   71 |       if (isErrorVisible) {
   72 |         const errorText = await errorAlert.textContent();
   73 |         console.log('❌ Login error:', errorText);
   74 |         throw new Error(`Login failed: ${errorText}`);
   75 |       }
   76 |
   77 |       throw new Error('Login failed: Did not redirect to /bewirtungsbeleg');
   78 |     }
   79 |
   80 |     console.log('=== Step 4: Verify Authentication ===');
   81 |
   82 |     // Verify we're on the main page
   83 |     await expect(page).toHaveURL(/.*bewirtungsbeleg/);
   84 |     console.log('✓ URL verified: /bewirtungsbeleg');
   85 |
   86 |     // Verify page content is loaded (check for form or main content)
   87 |     // This ensures we're not just on the page but actually authenticated
   88 |     await expect(page.locator('body')).toBeVisible();
   89 |     console.log('✓ Page content loaded');
   90 |
   91 |     // Take screenshot of successful login
   92 |     const timestamp = Date.now();
   93 |     await page.screenshot({ path: `test-results/login-success-${timestamp}.png`, fullPage: true });
   94 |     console.log(`📸 Success screenshot saved: test-results/login-success-${timestamp}.png`);
   95 |
   96 |     console.log('=== Test Complete ===');
   97 |     console.log('✅ Login flow working correctly!');
   98 |   });
   99 |
  100 |   test('should show error for invalid credentials', async ({ page }) => {
  101 |     console.log('=== Testing Invalid Credentials ===');
  102 |
  103 |     // Navigate to signin page (using German URL from actual frontend)
  104 |     await page.goto('/auth/anmelden');
  105 |     await page.waitForLoadState('networkidle');
  106 |
  107 |     // Fill with invalid credentials
> 108 |     await page.getByTestId('login-email').fill('invalid@example.com');
      |                                           ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  109 |     await page.getByTestId('login-password').fill('WrongPassword123!');
  110 |
  111 |     // Submit
  112 |     await page.getByTestId('login-submit').click();
  113 |
  114 |     // Wait for button to finish loading state
  115 |     await expect(page.getByTestId('login-submit')).not.toHaveAttribute('data-loading', 'true', { timeout: 10000 });
  116 |     console.log('✓ Button loading state cleared');
  117 |
  118 |     // Should show error alert
  119 |     const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Fehler|Error|Ungültig|falsch/i });
  120 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
  121 |
  122 |     const errorText = await errorAlert.textContent();
  123 |     console.log('✓ Error shown for invalid credentials:', errorText);
  124 |   });
  125 | });
  126 |
```
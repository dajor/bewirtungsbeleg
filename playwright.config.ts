import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Test Execution Order:
 * - playwright-1-register.spec.ts and playwright-2-login.spec.ts are designed to run sequentially
 * - playwright-1-register creates a test user account
 * - playwright-2-login depends on that account existing
 * - Files are named with numbers to ensure alphabetical execution order
 * - When running these tests specifically, use: yarn test:e2e:auth
 */
export default defineConfig({
  testDir: './test',
  testMatch: [
    '**/end2end-test.spec.ts',
    '**/pdf-conversion.spec.ts',
    '**/pdf-simple.spec.ts',
    '**/e2e-complete-workflow.spec.ts',
    '**/e2e-critical-scenarios.spec.ts',
    '**/image-preview-real.spec.ts',
    '**/e2e-zugferd.spec.ts',
    '**/e2e-eigenbeleg-workflow.spec.ts',
    '**/eigenbeleg-validation-simple.spec.ts',
    '**/playwright-1-register.spec.ts',
    '**/playwright-2-login.spec.ts',
    '**/playwright-3-pdf-upload.spec.ts',
    '**/playwright-3-multi-pdf-upload.spec.ts',
    '**/playwright-3-password-reset.spec.ts',
    '**/playwright-4-magic-link.spec.ts',
    '**/playwright-4-multi-pdf-combinations.spec.ts'
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'yarn dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
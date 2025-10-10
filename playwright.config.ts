import { defineConfig, devices } from '@playwright/test';

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
    '**/playwright-register.spec.ts'
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
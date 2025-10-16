import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'test/**',
      'e2e/**',
      '**/*.config.*',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/test-utils.tsx',
      'src/**/*.{spec,test}.{js,jsx}', // Exclude JS/JSX test files that might use Jest-specific APIs
      'src/**/*e2e*.{test,spec}.{ts,tsx}', // Exclude E2E tests that require a running server
      'src/app/api/generate-pdf/e2e.test.ts', // Specific E2E test file
      'src/__tests__/routes-validation.test.ts', // Routes validation test that requires a server
      'src/__tests__/integration/auth-real-user.integration.test.ts', // Integration test that requires a server
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'test/**',
        'e2e/**',
        '**/*.config.*',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/test-utils.tsx',
        'src/**/*.{spec,test}.{js,jsx}', // Exclude JS/JSX test files that might use Jest-specific APIs
        'src/**/*e2e*.{test,spec}.{ts,tsx}', // Exclude E2E tests that require a running server
        'src/app/api/generate-pdf/e2e.test.ts', // Specific E2E test file
        'src/__tests__/routes-validation.test.ts', // Routes validation test that requires a server
        'src/__tests__/integration/auth-real-user.integration.test.ts', // Integration test that requires a server
      ],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

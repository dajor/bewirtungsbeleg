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
      '**/*.spec.ts',
      '**/*.test.ts',
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
        '**/*.spec.ts',
        '**/*.test.ts',
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

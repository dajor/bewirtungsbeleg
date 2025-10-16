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

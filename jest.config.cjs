const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.before.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^canvas$': '<rootDir>/__mocks__/canvas.js',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 20,
      lines: 60,
      statements: 60,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/test/',
    '/e2e/',
    'BewirtungsbelegForm.calculations.test.tsx', // Skip due to canvas/jsdom conflicts
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};

module.exports = createJestConfig(config); 
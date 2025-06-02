import { getEnvVariable } from './env';

describe('Environment Variable Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEnvVariable', () => {
    it('should return environment variable value when it exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVariable('TEST_VAR')).toBe('test-value');
    });

    it('should throw error when required variable is missing', () => {
      delete process.env.TEST_VAR;
      expect(() => getEnvVariable('TEST_VAR')).toThrow(
        'Missing required environment variable: TEST_VAR'
      );
    });

    it('should return empty string when optional variable is missing', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVariable('TEST_VAR', false)).toBe('');
    });

    it('should return value when optional variable exists', () => {
      process.env.TEST_VAR = 'optional-value';
      expect(getEnvVariable('TEST_VAR', false)).toBe('optional-value');
    });
  });

  describe('env object', () => {
    it('should expose required environment variables', () => {
      // Set required env vars for test
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      
      // Re-import to get fresh env object
      jest.resetModules();
      const { env } = require('./env');
      
      expect(env.OPENAI_API_KEY).toBe('test-openai-key');
      expect(env.NEXTAUTH_SECRET).toBe('test-secret');
      expect(env.NODE_ENV).toBe('test');
    });

    it('should use default values for optional variables', () => {
      delete process.env.NEXTAUTH_URL;
      
      // Re-import to get fresh env object
      jest.resetModules();
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      
      const { env } = require('./env');
      
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
    });
  });
});
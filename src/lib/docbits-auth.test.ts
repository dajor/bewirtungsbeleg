/**
 * BDD: DocBits Authentication Unit Tests
 *
 * PURPOSE: Test authentication functions with mocked DocBits API
 *
 * BUSINESS CONTEXT:
 * These tests validate the authentication layer WITHOUT making real API calls.
 * They ensure our code correctly:
 * - Formats OAuth2 requests (Basic Auth, form-urlencoded body)
 * - Handles various API responses (success, errors, network failures)
 * - Translates errors to German for better UX
 * - Validates configuration (client credentials)
 *
 * WHY UNIT TESTS + INTEGRATION TESTS?
 * - Unit tests: Fast, reliable, don't depend on external services
 * - Integration tests: Catch real-world issues like OAuth2 misconfiguration
 * - Both are needed for complete coverage!
 *
 * PRODUCTION BUGS FIXED:
 * 1. **Missing Basic Auth**: Tests verify Authorization header is present
 * 2. **Wrong Content-Type**: Tests verify application/x-www-form-urlencoded
 * 3. **Empty Credentials**: Tests verify validation before API call
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  docbitsLogin,
  docbitsRegister,
  docbitsGetProfile,
  docbitsRefreshToken,
  docbitsEmailExists,
  DocBitsAuthError,
} from './docbits-auth';
import { env } from './env';

// Mock the env module
vi.mock('./env', () => ({
  env: {
    AUTH_SERVER: 'https://test.auth.docbits.com',
    DOCBITS_CLIENT_ID: 'test-client-id',
    DOCBITS_CLIENT_SECRET: 'test-client-secret',
  },
}));

describe('DocBits Authentication Functions', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('docbitsLogin', () => {
    describe('BDD: Successful Login', () => {
      it('should successfully login and return token + user profile', async () => {
        // Mock successful token response
        (global.fetch as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: 'test-access-token',
              token_type: 'Bearer',
              expires_in: 900,
              refresh_token: 'test-refresh-token',
            }),
          })
          // Mock successful profile response
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              user_id: '123',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: 'user',
            }),
          });

        const result = await docbitsLogin({
          email: 'test@example.com',
          password: 'password123',
        });

        // Verify result structure
        expect(result.token).toEqual({
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 900,
          refresh_token: 'test-refresh-token',
        });

        expect(result.user).toEqual({
          user_id: '123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
        });

        // Verify OAuth2 token request
        expect(global.fetch).toHaveBeenNthCalledWith(
          1,
          'https://test.auth.docbits.com/oauth2/token',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': expect.stringContaining('Basic '),
            }),
          })
        );

        // Verify Basic Auth is correct: base64(client_id:client_secret)
        const authHeader = (global.fetch as any).mock.calls[0][1].headers.Authorization;
        const base64Credentials = authHeader.replace('Basic ', '');
        const decoded = Buffer.from(base64Credentials, 'base64').toString();
        expect(decoded).toBe('test-client-id:test-client-secret');

        // Verify request body format
        const requestBody = (global.fetch as any).mock.calls[0][1].body;
        expect(requestBody.toString()).toContain('grant_type=password');
        expect(requestBody.toString()).toContain('username=test%40example.com');
        expect(requestBody.toString()).toContain('password=password123');

        // Verify profile request
        expect(global.fetch).toHaveBeenNthCalledWith(
          2,
          'https://test.auth.docbits.com/oauth2/profile',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-access-token',
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    describe('BDD: Missing Client Credentials', () => {
      it('should throw error when DOCBITS_CLIENT_ID is missing', async () => {
        // Temporarily clear client ID
        const originalClientId = env.DOCBITS_CLIENT_ID;
        // @ts-ignore
        env.DOCBITS_CLIENT_ID = '';

        try {
          await docbitsLogin({
            email: 'test@example.com',
            password: 'password123',
          });

          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(DocBitsAuthError);
          const authError = error as DocBitsAuthError;
          expect(authError.code).toBe('MISSING_CLIENT_CREDENTIALS');
          expect(authError.message).toContain('DOCBITS_CLIENT_ID');
          expect(authError.message).toContain('DOCBITS_CLIENT_SECRET');
        } finally {
          // Restore
          // @ts-ignore
          env.DOCBITS_CLIENT_ID = originalClientId;
        }
      });
    });

    describe('BDD: Failed Login - Invalid Credentials', () => {
      it('should throw DocBitsAuthError on 401 Unauthorized', async () => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: 'invalid_grant',
            error_description: 'Invalid username or password',
          }),
        });

        try {
          await docbitsLogin({
            email: 'test@example.com',
            password: 'wrongpassword',
          });

          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(DocBitsAuthError);
          const authError = error as DocBitsAuthError;
          expect(authError.statusCode).toBe(401);
          expect(authError.code).toBe('invalid_grant');
          expect(authError.message).toContain('Invalid username or password');
        }
      });
    });

    describe('BDD: Network Error', () => {
      it('should handle network errors gracefully', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

        try {
          await docbitsLogin({
            email: 'test@example.com',
            password: 'password123',
          });

          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(DocBitsAuthError);
          const authError = error as DocBitsAuthError;
          expect(authError.code).toBe('NETWORK_ERROR');
          expect(authError.message).toContain('Netzwerkfehler');
        }
      });
    });

    describe('BDD: Profile Fetch Failure', () => {
      it('should handle profile fetch error after successful token', async () => {
        // Token request succeeds
        (global.fetch as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: 'test-token',
              token_type: 'Bearer',
              expires_in: 900,
            }),
          })
          // Profile request fails
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
          });

        try {
          await docbitsLogin({
            email: 'test@example.com',
            password: 'password123',
          });

          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(DocBitsAuthError);
          const authError = error as DocBitsAuthError;
          expect(authError.statusCode).toBe(500);
          expect(authError.message).toContain('Benutzerprofil');
        }
      });
    });
  });

  describe('docbitsRefreshToken', () => {
    it('should refresh token with Basic Auth', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 900,
        }),
      });

      const result = await docbitsRefreshToken('old-refresh-token');

      expect(result.access_token).toBe('new-access-token');

      // Verify Basic Auth header
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.auth.docbits.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );

      // Verify request body
      const requestBody = (global.fetch as any).mock.calls[0][1].body;
      expect(requestBody.toString()).toContain('grant_type=refresh_token');
      expect(requestBody.toString()).toContain('refresh_token=old-refresh-token');
    });

    it('should throw error when client credentials missing', async () => {
      const originalClientId = env.DOCBITS_CLIENT_ID;
      // @ts-ignore
      env.DOCBITS_CLIENT_ID = '';

      try {
        await docbitsRefreshToken('test-token');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(DocBitsAuthError);
        const authError = error as DocBitsAuthError;
        expect(authError.code).toBe('MISSING_CLIENT_CREDENTIALS');
      } finally {
        // @ts-ignore
        env.DOCBITS_CLIENT_ID = originalClientId;
      }
    });
  });

  describe('docbitsRegister', () => {
    it('should successfully register new user', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: '456',
          email: 'newuser@example.com',
          first_name: 'New',
          last_name: 'User',
          role: 'user',
        }),
      });

      const result = await docbitsRegister({
        email: 'newuser@example.com',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'User',
      });

      expect(result.user_id).toBe('456');
      expect(result.email).toBe('newuser@example.com');

      // Verify registration request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.auth.docbits.com/user/create',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle duplicate email error (409 Conflict)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          code: 'USER_EXISTS',
          message: 'User already exists',
        }),
      });

      try {
        await docbitsRegister({
          email: 'existing@example.com',
          password: 'Password123!',
          first_name: 'Test',
          last_name: 'User',
        });

        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(DocBitsAuthError);
        const authError = error as DocBitsAuthError;
        expect(authError.statusCode).toBe(409);
        expect(authError.code).toBe('USER_EXISTS');
        expect(authError.message).toContain('E-Mail-Adresse existiert bereits');
      }
    });
  });

  describe('docbitsGetProfile', () => {
    it('should fetch user profile with access token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: '789',
          email: 'profile@example.com',
          first_name: 'Profile',
          last_name: 'Test',
          role: 'admin',
        }),
      });

      const result = await docbitsGetProfile('test-access-token');

      expect(result.user_id).toBe('789');
      expect(result.role).toBe('admin');

      // Verify Bearer token
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.auth.docbits.com/oauth2/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token',
          }),
        })
      );
    });
  });

  describe('docbitsEmailExists', () => {
    describe('BDD: GIVEN email exists in DocBits', () => {
      it('WHEN checking via /user/create THEN should return true on 409 Conflict', async () => {
        // GIVEN: DocBits returns 409 Conflict for duplicate email
        (global.fetch as any).mockResolvedValueOnce({
          status: 409,
          ok: false,
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('existing@example.com');

        // THEN: Should return true
        expect(result).toBe(true);

        // AND: Should call /user/create with dummy data
        expect(global.fetch).toHaveBeenCalledWith(
          'https://test.auth.docbits.com/user/create',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('existing@example.com'),
          })
        );

        // Verify request contains dummy password
        const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(requestBody.password).toBe('__CHECK_ONLY__');
        expect(requestBody.first_name).toBe('__CHECK__');
        expect(requestBody.last_name).toBe('__ONLY__');
      });

      it('WHEN checking via /user/create THEN should return true on 400 with USER_EXISTS code', async () => {
        // GIVEN: DocBits returns 400 with USER_EXISTS code
        (global.fetch as any).mockResolvedValueOnce({
          status: 400,
          ok: false,
          json: async () => ({
            code: 'USER_EXISTS',
            message: 'User already exists',
          }),
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('existing@example.com');

        // THEN: Should return true
        expect(result).toBe(true);
      });
    });

    describe('BDD: GIVEN email is available', () => {
      it('WHEN checking via /user/create THEN should return false on 400 without USER_EXISTS', async () => {
        // GIVEN: DocBits returns 400 for validation error (not user exists)
        (global.fetch as any).mockResolvedValueOnce({
          status: 400,
          ok: false,
          json: async () => ({
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
          }),
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('available@example.com');

        // THEN: Should return false (email available)
        expect(result).toBe(false);
      });

      it('WHEN checking via /user/create THEN should return false on 200 OK', async () => {
        // GIVEN: DocBits successfully creates user (shouldn't happen with dummy data)
        (global.fetch as any).mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({
            user_id: 'test',
          }),
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('new@example.com');

        // THEN: Should return false (fail open)
        expect(result).toBe(false);
      });

      it('WHEN checking via /user/create THEN should return false on 500 error', async () => {
        // GIVEN: DocBits returns 500 Internal Server Error
        (global.fetch as any).mockResolvedValueOnce({
          status: 500,
          ok: false,
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('test@example.com');

        // THEN: Should return false (fail open to allow registrations)
        expect(result).toBe(false);
      });
    });

    describe('BDD: GIVEN network failure', () => {
      it('WHEN network request fails THEN should return false (fail open)', async () => {
        // GIVEN: Network error occurs
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('test@example.com');

        // THEN: Should return false (fail open)
        expect(result).toBe(false);

        // AND: Should log warning
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[DocBits] Email existence check failed:',
          expect.any(Error)
        );

        consoleWarnSpy.mockRestore();
      });

      it('WHEN fetch throws error THEN should not throw but return false', async () => {
        // GIVEN: Fetch throws unexpected error
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

        // WHEN: Checking if email exists
        // THEN: Should not throw error
        await expect(docbitsEmailExists('test@example.com')).resolves.toBe(false);

        consoleWarnSpy.mockRestore();
      });
    });

    describe('BDD: Edge Cases', () => {
      it('should handle malformed JSON response gracefully', async () => {
        // GIVEN: DocBits returns 400 with invalid JSON
        (global.fetch as any).mockResolvedValueOnce({
          status: 400,
          ok: false,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('test@example.com');

        // THEN: Should return false (json parse error treated as "email available")
        expect(result).toBe(false);
      });

      it('should handle empty response body', async () => {
        // GIVEN: DocBits returns 400 with empty body
        (global.fetch as any).mockResolvedValueOnce({
          status: 400,
          ok: false,
          json: async () => ({}),
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists('test@example.com');

        // THEN: Should return false (no USER_EXISTS code)
        expect(result).toBe(false);
      });

      it('should handle special characters in email', async () => {
        // GIVEN: Email with special characters
        const specialEmail = 'test+tag@example.com';
        (global.fetch as any).mockResolvedValueOnce({
          status: 409,
          ok: false,
        });

        // WHEN: Checking if email exists
        const result = await docbitsEmailExists(specialEmail);

        // THEN: Should work correctly
        expect(result).toBe(true);

        // Verify email was properly sent
        const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(requestBody.email).toBe(specialEmail);
      });
    });

    describe('BDD: Fail-Open Architecture Rationale', () => {
      it('SCENARIO: DocBits temporarily unavailable - should allow registration', async () => {
        // GIVEN: DocBits service is down
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        (global.fetch as any).mockRejectedValueOnce(new Error('Service unavailable'));

        // WHEN: User tries to register
        const result = await docbitsEmailExists('new-user@example.com');

        // THEN: Should return false (allow registration)
        // RATIONALE: Better to allow potential duplicate than block legitimate new users
        // Secondary check will catch duplicates during account creation
        expect(result).toBe(false);

        consoleWarnSpy.mockRestore();
      });

      it('SCENARIO: Unexpected status code - should allow registration', async () => {
        // GIVEN: DocBits returns unexpected 503 Service Unavailable
        (global.fetch as any).mockResolvedValueOnce({
          status: 503,
          ok: false,
        });

        // WHEN: User tries to register
        const result = await docbitsEmailExists('new-user@example.com');

        // THEN: Should return false (fail open)
        expect(result).toBe(false);
      });
    });
  });
});

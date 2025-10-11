/**
 * Unit tests for DocBits Password Management
 * Tests both password change (authenticated) and password reset (token-based) flows
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  docbitsChangePassword,
  docbitsResetPasswordWithToken,
  DocBitsAuthError,
} from '../docbits-auth';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment
vi.mock('../env', () => ({
  env: {
    AUTH_SERVER: 'https://dev.auth.docbits.com',
    NODE_ENV: 'test',
    ADMIN_AUTH_USER: 'admin',
    ADMIN_AUTH_PASSWORD: 'admin-password',
  },
}));

describe('docbits-auth-password.ts - Password Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('docbitsChangePassword() - Authenticated Password Change', () => {
    const mockAccessToken = 'mock-bearer-token-12345';
    const currentPassword = 'OldPassword123!';
    const newPassword = 'NewSecure456!';

    it('should successfully change password with valid credentials', async () => {
      // Mock successful password change
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Password changed successfully',
        }),
      });

      await docbitsChangePassword(mockAccessToken, currentPassword, newPassword);

      // Verify correct API call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://dev.auth.docbits.com/me/password',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );

      // Verify request body has correct fields
      const callArgs = mockFetch.mock.calls[0][1];
      const bodyString = callArgs.body.toString();
      expect(bodyString).toContain('current_password=');
      expect(bodyString).toContain('new_password=');
      expect(bodyString).toContain('new_password_confirm=');
    });

    it('should throw error when current password is wrong (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'invalid_password',
          message: 'Current password is incorrect',
        }),
      });

      await expect(
        docbitsChangePassword(mockAccessToken, 'WrongPassword', newPassword)
      ).rejects.toThrow('Aktuelles Passwort ist falsch');
    });

    it('should throw error when new password is invalid (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_request',
          message: 'Password does not meet requirements',
        }),
      });

      await expect(
        docbitsChangePassword(mockAccessToken, currentPassword, '123')
      ).rejects.toThrow(DocBitsAuthError);
    });

    it('should throw error when Bearer token is missing or invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'unauthorized',
          message: 'Invalid or missing token',
        }),
      });

      await expect(
        docbitsChangePassword('', currentPassword, newPassword)
      ).rejects.toThrow(DocBitsAuthError);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(
        docbitsChangePassword(mockAccessToken, currentPassword, newPassword)
      ).rejects.toThrow('Netzwerkfehler beim Ändern des Passworts');
    });

    it('should use correct field names (not email or password)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await docbitsChangePassword(mockAccessToken, currentPassword, newPassword);

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyString = callArgs.body.toString();

      // Should NOT contain old field name 'email'
      expect(bodyString).not.toContain('email=');

      // Should contain all three correct new field names
      expect(bodyString).toContain('current_password=');
      expect(bodyString).toContain('new_password=');
      expect(bodyString).toContain('new_password_confirm=');

      // Ensure we're not using the old simple 'password' field (would be at start of string or after '&')
      expect(bodyString).not.toMatch(/[&]password=/);
      expect(bodyString).not.toMatch(/^password=/);
    });
  });

  describe('docbitsResetPasswordWithToken() - Token-Based Password Reset', () => {
    const email = 'test@example.com';
    const newPassword = 'NewSecure456!';
    const resetToken = 'mock-reset-token-abc123';
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should successfully reset password using Management API', async () => {
      // Mock user lookup response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [mockUser],
        }),
      });

      // Mock password update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: mockUser,
        }),
      });

      await docbitsResetPasswordWithToken(email, newPassword, resetToken);

      // Verify user lookup call
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://dev.auth.docbits.com/management/api/users?email=test%40example.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Basic YWRtaW46YWRtaW4tcGFzc3dvcmQ=', // base64('admin:admin-password')
            'Content-Type': 'application/json',
          }),
        })
      );

      // Verify password update call
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://dev.auth.docbits.com/management/user/user-123',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Basic YWRtaW46YWRtaW4tcGFzc3dvcmQ=',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            password: newPassword,
            first_name: mockUser.first_name,
            last_name: mockUser.last_name,
            email: mockUser.email,
          }),
        })
      );
    });

    it('should throw error when user is not found (404)', async () => {
      // Mock empty user lookup response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [],
        }),
      });

      await expect(
        docbitsResetPasswordWithToken(email, newPassword, resetToken)
      ).rejects.toMatchObject({
        message: 'Benutzer mit dieser E-Mail-Adresse nicht gefunden',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should throw error when admin auth fails (401)', async () => {
      // Mock failed admin auth
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
        }),
      });

      await expect(
        docbitsResetPasswordWithToken(email, newPassword, resetToken)
      ).rejects.toMatchObject({
        message: 'Admin-Authentifizierung fehlgeschlagen',
        statusCode: 401,
        code: 'ADMIN_AUTH_FAILED',
      });
    });

    it('should throw error when password update fails (400)', async () => {
      // Mock successful user lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [mockUser],
        }),
      });

      // Mock failed password update (invalid password)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Password must be at least 8 characters',
        }),
      });

      await expect(
        docbitsResetPasswordWithToken(email, 'weak', resetToken)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PASSWORD',
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(
        docbitsResetPasswordWithToken(email, newPassword, resetToken)
      ).rejects.toThrow('Netzwerkfehler beim Zurücksetzen des Passworts');
    });

    it('should work with alternative response format (data instead of users)', async () => {
      // Mock user lookup with 'data' field
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [mockUser],
        }),
      });

      // Mock password update response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
        }),
      });

      await docbitsResetPasswordWithToken(email, newPassword, resetToken);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should accept optional reset token parameter', async () => {
      // Mock user lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [mockUser],
        }),
      });

      // Mock password update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // Should work without token (token is optional)
      await docbitsResetPasswordWithToken(email, newPassword);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Password Change vs Password Reset - Differences', () => {
    it('docbitsChangePassword requires Bearer token and current password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const accessToken = 'bearer-token-123';
      const currentPass = 'Old123!';
      const newPass = 'New456!';

      await docbitsChangePassword(accessToken, currentPass, newPass);

      // Verify Authorization header with Bearer token
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${accessToken}`,
          }),
        })
      );

      // Verify current_password is required
      const body = mockFetch.mock.calls[0][1].body.toString();
      expect(body).toContain('current_password=');
    });

    it('docbitsResetPasswordWithToken uses Admin Basic Auth (not Bearer token)', async () => {
      // Mock user lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          users: [{
            id: 'user-456',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
          }],
        }),
      });

      // Mock password update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await docbitsResetPasswordWithToken('test@example.com', 'New123!', 'token-abc');

      // Verify uses Admin Basic Auth (not Bearer token)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Basic YWRtaW46YWRtaW4tcGFzc3dvcmQ=', // Not Bearer token
          }),
        })
      );

      // Verify does NOT require current_password (user forgot it)
      const updateCall = mockFetch.mock.calls[1];
      const body = JSON.parse(updateCall[1].body);
      expect(body).not.toHaveProperty('current_password');
      expect(body).toHaveProperty('password'); // Only new password
    });
  });

  describe('BDD Scenario: User Changes Password', () => {
    it('Given logged-in user, When changing password, Then should require current password', async () => {
      // Given: User is logged in with valid Bearer token
      const userToken = 'valid-bearer-token';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // When: User changes password
      await docbitsChangePassword(userToken, 'Current123!', 'New456!');

      // Then: Request should include current password
      const body = mockFetch.mock.calls[0][1].body.toString();
      expect(body).toContain('current_password=');
      expect(body).toContain('new_password=');
      expect(body).toContain('new_password_confirm=');
    });
  });

  describe('BDD Scenario: User Resets Forgotten Password', () => {
    it('Given password reset token, When resetting password, Then should use Management API with admin auth', async () => {
      // Given: User received password reset email with token
      const resetToken = 'email-verification-token-xyz';
      const mockUser = {
        id: 'user-789',
        email: 'user@example.com',
        first_name: 'Forgotten',
        last_name: 'Password',
      };

      // Mock user lookup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ users: [mockUser] }),
      });

      // Mock password update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      // When: User resets password
      await docbitsResetPasswordWithToken('user@example.com', 'New789!', resetToken);

      // Then: Should use Management API with admin credentials
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/management/api/users?email='),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/management/user/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );
    });
  });
});

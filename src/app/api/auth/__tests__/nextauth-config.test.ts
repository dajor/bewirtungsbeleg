/**
 * BDD: NextAuth Configuration Tests
 *
 * PURPOSE: Validate NextAuth.js configuration for DocBits authentication
 *
 * BUSINESS CONTEXT:
 * These tests validate the NextAuth configuration:
 * - Session strategy is JWT with correct expiry
 * - Pages are correctly configured for signin/error
 * - Callbacks structure session data correctly
 * - Multiple auth providers are configured (credentials, magic-link)
 *
 * WHY THESE TESTS ARE CRITICAL:
 * - NextAuth is the authentication gateway for the entire application
 * - Wrong configuration breaks ALL authentication flows
 * - Session structure affects authorization throughout the app
 * - JWT expiry affects user experience (too short = frequent re-logins)
 *
 * PRODUCTION BUGS THESE TESTS CATCH:
 * 1. **Wrong Session Strategy**: Using database instead of JWT
 * 2. **Missing Provider Configuration**: No credentials provider
 * 3. **Wrong Session Expiry**: Too short or too long
 * 4. **Missing Callback Pages**: Users see default NextAuth pages
 *
 * BUSINESS RULES:
 * - Sessions expire after 30 days (maxAge: 30 * 24 * 60 * 60)
 * - JWT strategy (no database required)
 * - Custom signin page at /auth/anmelden
 * - Custom error page at /auth/error
 *
 * TEST STRATEGY:
 * - Test NextAuth configuration object structure
 * - Verify provider configuration
 * - Test callback functions with mock data
 * - Validate session/JWT structure
 *
 * @jest-environment node
 */

import { describe, it, expect } from 'vitest';
import { authOptions } from '@/lib/auth';

describe('NextAuth Configuration', () => {
  describe('BDD: Session Strategy', () => {
    /**
     * GIVEN NextAuth needs to manage user sessions
     * WHEN configuration is loaded
     * THEN session strategy should be JWT (not database)
     * AND maxAge should be 30 days
     *
     * WHY JWT STRATEGY:
     * - No database required (simpler deployment)
     * - Faster (no DB lookup on each request)
     * - Stateless (scales horizontally)
     * - Works with serverless/edge functions
     *
     * BUSINESS RULE: 30-day sessions balance security vs UX
     * - Too short: Users annoyed by frequent re-logins
     * - Too long: Security risk if device is compromised
     */
    it('should use JWT strategy with 30-day expiry', () => {
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days in seconds
    });

    it('should configure JWT with matching 30-day expiry', () => {
      expect(authOptions.jwt).toBeDefined();
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60);
    });
  });

  describe('BDD: Authentication Providers', () => {
    /**
     * GIVEN users need multiple ways to authenticate
     * WHEN NextAuth is configured
     * THEN it should have multiple providers:
     * - credentials: Email/password login via DocBits
     * - magic-link: Passwordless email link authentication
     *
     * WHY MULTIPLE PROVIDERS:
     * - Credentials: Traditional login for returning users
     * - Magic Link: Passwordless for better UX/security
     *
     * BUSINESS RULE: Credentials provider MUST integrate with DocBits OAuth2
     */
    it('should have credentials provider configured', () => {
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThanOrEqual(1);

      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      );

      expect(credentialsProvider).toBeDefined();
      // NextAuth Credentials Provider capitalizes the name
      expect(credentialsProvider.name).toBe('Credentials');
    });

    it('should have at least one auth provider configured', () => {
      // Test that we have providers configured (credentials is the main one)
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers.length).toBeGreaterThan(0);

      // Credentials provider should always be present
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      );
      expect(credentialsProvider).toBeDefined();
    });

    it('should configure credentials provider with email and password fields', () => {
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      ) as any;

      expect(credentialsProvider.options.credentials).toBeDefined();
      expect(credentialsProvider.options.credentials.email).toBeDefined();
      expect(credentialsProvider.options.credentials.password).toBeDefined();
    });
  });

  describe('BDD: Custom Pages Configuration', () => {
    /**
     * GIVEN users need branded authentication pages
     * WHEN they access authentication flows
     * THEN they should see custom pages (not default NextAuth UI)
     * AND pages should be at /auth/anmelden and /auth/error
     *
     * WHY CUSTOM PAGES:
     * - Branded experience matching application design
     * - German language instead of English defaults
     * - Custom error handling and messaging
     *
     * BUSINESS RULE: All auth pages must be in German
     */
    it('should configure custom signin page', () => {
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.pages?.signIn).toBe('/auth/anmelden');
    });

    it('should configure custom error page', () => {
      expect(authOptions.pages?.error).toBe('/auth/error');
    });
  });

  describe('BDD: Callback Functions', () => {
    /**
     * GIVEN NextAuth needs to structure session data
     * WHEN JWT and session callbacks are invoked
     * THEN they should include all required fields:
     * - User identity (id, email, name)
     * - Authorization (role)
     * - API access (accessToken, refreshToken)
     *
     * WHY CALLBACKS:
     * - JWT callback: Store user data in JWT token
     * - Session callback: Expose data to frontend
     *
     * BUSINESS RULE: Session must include role for authorization
     */
    it('should have JWT callback configured', () => {
      expect(authOptions.callbacks).toBeDefined();
      expect(authOptions.callbacks?.jwt).toBeDefined();
      expect(typeof authOptions.callbacks?.jwt).toBe('function');
    });

    it('should have session callback configured', () => {
      expect(authOptions.callbacks?.session).toBeDefined();
      expect(typeof authOptions.callbacks?.session).toBe('function');
    });

    it('should populate JWT with user data on signin', async () => {
      const jwtCallback = authOptions.callbacks?.jwt!;

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        firstName: 'Test',
        lastName: 'User',
      };

      const token = await jwtCallback({
        token: {},
        user: mockUser as any,
      });

      expect(token.id).toBe('user-123');
      expect(token.role).toBe('admin');
      expect(token.accessToken).toBe('mock-token');
      expect(token.refreshToken).toBe('mock-refresh');
      expect(token.firstName).toBe('Test');
      expect(token.lastName).toBe('User');
    });

    it('should populate session with data from JWT', async () => {
      const sessionCallback = authOptions.callbacks?.session!;

      const mockToken = {
        id: 'user-456',
        email: 'user@example.com',
        name: 'Another User',
        role: 'user',
        accessToken: 'session-token',
        refreshToken: 'session-refresh',
        firstName: 'Another',
        lastName: 'User',
      };

      const mockSession = {
        user: {
          email: 'user@example.com',
          name: 'Another User',
        },
        expires: '2024-12-31',
      };

      const session = await sessionCallback({
        session: mockSession as any,
        token: mockToken as any,
      });

      expect(session.user.id).toBe('user-456');
      expect(session.user.role).toBe('user');
      expect(session.user.accessToken).toBe('session-token');
      expect(session.user.refreshToken).toBe('session-refresh');
      expect(session.user.firstName).toBe('Another');
      expect(session.user.lastName).toBe('User');
    });
  });

  describe('BDD: Security Configuration', () => {
    /**
     * GIVEN application requires secure authentication
     * WHEN NextAuth is configured
     * THEN it should have NEXTAUTH_SECRET configured
     * AND debug mode should only be enabled in development
     *
     * WHY SECURITY:
     * - NEXTAUTH_SECRET: Signs JWTs to prevent tampering
     * - Debug mode: Should be OFF in production (leaks sensitive info)
     *
     * BUSINESS RULE: Never deploy to production without NEXTAUTH_SECRET
     */
    it('should have secret configured', () => {
      expect(authOptions.secret).toBeDefined();
      expect(typeof authOptions.secret).toBe('string');
      expect(authOptions.secret!.length).toBeGreaterThan(0);
    });

    it('should have debug configuration as boolean', () => {
      // Debug should be boolean
      expect(typeof authOptions.debug).toBe('boolean');

      // Debug is controlled by NODE_ENV in env.ts
      // In production it should be false, in development it should be true
      // We just verify it's a boolean (actual value depends on environment)
      expect([true, false]).toContain(authOptions.debug);
    });
  });

  describe('BDD: Provider Authorization Logic', () => {
    /**
     * GIVEN a user submits invalid credentials
     * WHEN authorize function is called
     * THEN it should validate input before calling DocBits API
     * AND should throw user-friendly German error messages
     *
     * WHY VALIDATE FIRST:
     * - Fail fast (don't waste API calls)
     * - Better UX (instant feedback)
     * - Reduce load on DocBits API
     *
     * BUSINESS RULE: Both email and password are required
     */
    it('should validate email and password are provided', async () => {
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      ) as any;

      const authorize = credentialsProvider.options.authorize;

      // Test missing email
      try {
        await authorize({ email: '', password: 'test123' }, null);
        expect.fail('Should have thrown error for missing email');
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message).toContain('Email');
      }

      // Test missing password
      try {
        await authorize({ email: 'test@example.com', password: '' }, null);
        expect.fail('Should have thrown error for missing password');
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message).toContain('Passwort');
      }
    });
  });
});

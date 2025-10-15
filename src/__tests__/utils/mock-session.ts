/**
 * Mock NextAuth session utilities for testing
 */

import type { Session } from 'next-auth';

// Extended user type with role property
interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

// Extended session type with role property
interface ExtendedSession extends Session {
  user: ExtendedUser;
}

export const mockUser: ExtendedUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockSession: ExtendedSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export const mockUnauthenticatedSession: ExtendedSession | null = null;

export const mockAdminSession: ExtendedSession = {
  user: {
    ...mockUser,
    email: 'admin@example.com',
    role: 'admin',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Mock getServerSession for API route tests
 */
export function createMockGetServerSession(session: ExtendedSession | null) {
  // Simple mock function that returns a resolved promise
  return () => Promise.resolve(session);
}

/**
 * Mock NextAuth session utilities for testing
 */

import type { Session } from 'next-auth';

// Type for our mock sessions with role property
type MockSession = Session & {
  user: Session['user'] & {
    role?: string;
  };
};

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockSession: MockSession = {
  user: {
    ...mockUser,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export const mockUnauthenticatedSession: MockSession | null = null;

export const mockAdminSession: MockSession = {
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
export function createMockGetServerSession(session: MockSession | null) {
  // Simple mock function that returns a resolved promise
  return () => Promise.resolve(session);
}

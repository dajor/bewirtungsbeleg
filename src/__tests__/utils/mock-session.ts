/**
 * Mock NextAuth session utilities for testing
 */

import type { Session } from 'next-auth';

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user', // Default role
};

export const mockSession: Session = {
  user: {
    ...mockUser,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export const mockUnauthenticatedSession: Session | null = null;

export const mockAdminSession: Session = {
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
export function createMockGetServerSession(session: Session | null) {
  // Simple mock function that returns a resolved promise
  return () => Promise.resolve(session);
}

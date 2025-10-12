/**
 * Test for German password reset endpoint alias
 * Verifies that the German endpoint /api/auth/passwort-vergessen
 * correctly re-exports the English endpoint
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as germanRoute from './route';
import * as englishRoute from '../forgot-password/route';

describe('German Password Reset Alias', () => {
  it('should re-export POST from forgot-password route', () => {
    // Verify the German route exports POST
    expect(germanRoute.POST).toBeDefined();
    expect(typeof germanRoute.POST).toBe('function');

    // Verify it's the same function as the English route
    expect(germanRoute.POST).toBe(englishRoute.POST);
  });
});

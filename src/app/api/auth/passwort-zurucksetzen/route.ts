/**
 * German API Route Alias for Password Reset
 *
 * This route provides a German URL endpoint that maps to the reset-password handler.
 * Maintains consistency with other German routes like /api/auth/passwort-vergessen
 *
 * Frontend calls: /api/auth/passwort-zurucksetzen
 * This re-exports: /api/auth/reset-password handler
 */

export { POST } from '../reset-password/route';

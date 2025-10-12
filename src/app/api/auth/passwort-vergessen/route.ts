/**
 * German alias for forgot-password endpoint
 *
 * This is a language-specific alias that re-exports the main forgot-password endpoint.
 * The German frontend uses German URLs (/passwort-vergessen) while the main implementation
 * is in the English endpoint (/forgot-password).
 *
 * This pattern allows us to:
 * - Support multiple languages without code duplication
 * - Keep all business logic in one place
 * - Maintain consistency across language variants
 */

export { POST } from '../forgot-password/route';

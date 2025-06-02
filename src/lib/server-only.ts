/**
 * This file should only be imported in server-side code.
 * Importing it in client-side code will throw an error.
 */

import 'server-only';

// Re-export server-only utilities
export { env } from './env';
/**
 * Environment variable validation and access
 */

export function getEnvVariable(name: string, required: boolean = true): string {
  const value = process.env[name];
  
  if (!value && required) {
    console.error(`Missing required environment variable: ${name}`);
    // Return empty string instead of throwing in production
    if (process.env.NODE_ENV === 'production') {
      return '';
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}

export const env = {
  // OpenAI
  OPENAI_API_KEY: getEnvVariable('OPENAI_API_KEY'),

  // NextAuth
  NEXTAUTH_URL: getEnvVariable('NEXTAUTH_URL', false) || 'http://localhost:3000',
  NEXTAUTH_SECRET: getEnvVariable('NEXTAUTH_SECRET'),

  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Future: Database
  // DATABASE_URL: getEnvVariable('DATABASE_URL', false),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: getEnvVariable('UPSTASH_REDIS_REST_URL', false),
  UPSTASH_REDIS_REST_TOKEN: getEnvVariable('UPSTASH_REDIS_REST_TOKEN', false),

  // Google Places API
  GOOGLE_API_KEY_PLACES: getEnvVariable('GOOGLE_API_KEY_PLACES', false),
};
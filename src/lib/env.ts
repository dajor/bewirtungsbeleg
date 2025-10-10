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

  // Authentication
  AUTH_SERVER: getEnvVariable('AUTH_SERVER', false) || 'https://api.docbits.com',

  // Email
  EMAIL_FROM: getEnvVariable('EMAIL_FROM', false) || 'noreply@example.com',
  SMTP_HOST: getEnvVariable('SMTP_HOST', false),
  SMTP_PORT: getEnvVariable('SMTP_PORT', false),
  SMTP_USER: getEnvVariable('SMTP_USER', false),
  SMTP_PASS: getEnvVariable('SMTP_PASS', false),
};
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
  DOCBITS_CLIENT_ID: getEnvVariable('DOCBITS_CLIENT_ID', false),
  DOCBITS_CLIENT_SECRET: getEnvVariable('DOCBITS_CLIENT_SECRET', false),
  ADMIN_AUTH_USER: getEnvVariable('ADMIN_AUTH_USER', false),
  ADMIN_AUTH_PASSWORD: getEnvVariable('ADMIN_AUTH_PASSWORD', false),

  // Email
  EMAIL_FROM: getEnvVariable('EMAIL_FROM', false) || 'noreply@example.com',
  MAILERSEND_API_KEY: getEnvVariable('MAILERSEND_API_KEY', false),
  SMTP_HOST: getEnvVariable('SMTP_HOST', false),
  SMTP_PORT: getEnvVariable('SMTP_PORT', false),
  SMTP_USER: getEnvVariable('SMTP_USER', false),
  SMTP_PASS: getEnvVariable('SMTP_PASS', false),

  // OpenSearch
  OPENSEARCH_URL: getEnvVariable('OPENSEARCH_URL', false),
  OPENSEARCH_REGION: getEnvVariable('OPENSEARCH_REGION', false),
  OPENSEARCH_ACCESS_KEY_ID: getEnvVariable('OPENSEARCH_ACCESS_KEY_ID', false),
  OPENSEARCH_SECRET_ACCESS_KEY: getEnvVariable('OPENSEARCH_SECRET_ACCESS_KEY', false),
  OPENSEARCH_USERNAME: getEnvVariable('OPENSEARCH_USERNAME', false),
  OPENSEARCH_PASSWORD: getEnvVariable('OPENSEARCH_PASSWORD', false),

  // DigitalOcean Spaces (S3-compatible storage)
  DIGITALOCEAN_SPACES_ENDPOINT: getEnvVariable('DIGITALOCEAN_SPACES_ENDPOINT', false),
  DIGITALOCEAN_SPACES_BUCKET: getEnvVariable('DIGITALOCEAN_SPACES_BUCKET', false),
  DIGITALOCEAN_SPACES_KEY: getEnvVariable('DIGITALOCEAN_SPACES_KEY', false),
  DIGITALOCEAN_SPACES_SECRET: getEnvVariable('DIGITALOCEAN_SPACES_SECRET', false),
  DIGITALOCEAN_SPACES_FOLDER: getEnvVariable('DIGITALOCEAN_SPACES_FOLDER', false) || 'bewir-documents',
  DIGITALOCEAN_SPACES_REGION: getEnvVariable('DIGITALOCEAN_SPACES_REGION', false) || 'fra1',
};
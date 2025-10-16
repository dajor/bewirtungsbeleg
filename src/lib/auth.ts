import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { env } from '@/lib/env';
import { docbitsLogin, DocBitsAuthError } from '@/lib/docbits-auth';
import { ensureUserIndexMiddleware } from '@/middleware/ensure-user-index';

// For now, we'll use a simple in-memory user store
// In production, this should be replaced with a database
const users = [
  {
    id: '1',
    email: 'admin@docbits.com',
    name: 'Admin User',
    // Password: admin123 (hashed)
    password: '$2b$12$ZyOGlZh51z5aoTqDVZYOne14NVQFbM6V4oD/D651h/yS8chkcj/Yi',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@docbits.com',
    name: 'Test User',
    // Password: user123 (hashed)
    password: '$2b$12$d7pdxRjnoxwoSrqwun/xa.fI2gzJhA0A0BMjb.oJ7pJWJ/3QHLN6G',
    role: 'user',
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    // Regular password-based authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Bitte Email und Passwort eingeben');
        }

        console.log('[Auth] Login attempt for:', credentials.email);

        // First, check hardcoded admin/test users (for backward compatibility)
        const hardcodedUser = users.find((user) => user.email === credentials.email);

        if (hardcodedUser) {
          console.log('[Auth] Found hardcoded user, checking password');
          const isPasswordValid = await compare(credentials.password, hardcodedUser.password);

          if (!isPasswordValid) {
            console.log('[Auth] Hardcoded user password invalid');
            throw new Error('Ungültige Anmeldedaten');
          }

          console.log('[Auth] Hardcoded user authenticated successfully');
          return {
            id: hardcodedUser.id,
            email: hardcodedUser.email,
            name: hardcodedUser.name,
            role: hardcodedUser.role,
          };
        }

        // User not found in hardcoded list, try DocBits authentication
        console.log('[Auth] User not in hardcoded list, trying DocBits authentication');

        try {
          const { token, user } = await docbitsLogin({
            email: credentials.email,
            password: credentials.password,
          });

          console.log('[Auth] DocBits authentication successful for:', user.email);

          // Return user data for NextAuth session
          return {
            id: user.user_id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role || 'user',
            // Store tokens for future API calls
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
          };
        } catch (error) {
          console.error('[Auth] DocBits authentication failed:', error);

          if (error instanceof DocBitsAuthError) {
            // Provide better error messages based on DocBits response
            if (error.statusCode === 401) {
              throw new Error('E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.');
            } else if (error.code === 'USER_NOT_VERIFIED') {
              throw new Error('Bitte verifizieren Sie zuerst Ihre E-Mail-Adresse.');
            } else if (error.code === 'USER_DISABLED') {
              throw new Error('Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Support.');
            }
          }

          // Generic error for other cases
          throw new Error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
        }
      },
    }),
    // Magic link authentication (passwordless)
    CredentialsProvider({
      id: 'magic-link',
      name: 'magic-link',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('E-Mail ist erforderlich');
        }

        // For magic link, we trust that the token was already verified
        // by the /api/auth/magic-link/verify endpoint before this is called

        // Try to get user from DocBits if possible
        // For now, create a basic user object
        // TODO: Integrate with DocBits to get actual user profile

        return {
          id: credentials.email, // Use email as ID for now
          email: credentials.email,
          name: credentials.email.split('@')[0], // Extract name from email
          role: 'user',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/anmelden',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // Store DocBits tokens if they exist
        if (user.accessToken) {
          token.accessToken = user.accessToken;
        }
        if (user.refreshToken) {
          token.refreshToken = user.refreshToken;
        }
        // Store additional user properties for session callback
        if ((user as any).firstName) {
          token.firstName = (user as any).firstName;
        }
        if ((user as any).lastName) {
          token.lastName = (user as any).lastName;
        }
        if ((user as any).email) {
          token.email = (user as any).email;
        }
        if ((user as any).name) {
          token.name = (user as any).name;
        }

        // Ensure user has OpenSearch index for document search
        // This runs asynchronously on login to create user-specific index
        try {
          await ensureUserIndexMiddleware(user.id);
          console.log(`[Auth] OpenSearch index ensured for user: ${user.id}`);
        } catch (error) {
          console.error(`[Auth] Failed to ensure OpenSearch index for user ${user.id}:`, error);
          // Don't fail login if OpenSearch is unavailable
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        // Add tokens to session for API calls
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        if (token.refreshToken) {
          session.refreshToken = token.refreshToken as string;
        }
        // Add additional user properties
        if (token.firstName) {
          (session.user as any).firstName = token.firstName as string;
        }
        if (token.lastName) {
          (session.user as any).lastName = token.lastName as string;
        }
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === 'development',
};
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { env } from '@/lib/env';

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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Bitte Email und Passwort eingeben');
        }

        const user = users.find((user) => user.email === credentials.email);
        
        if (!user) {
          throw new Error('Ungültige Anmeldedaten');
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error('Ungültige Anmeldedaten');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
  debug: env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
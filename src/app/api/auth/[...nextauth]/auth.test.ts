import { authOptions } from '@/lib/auth';
import { compare } from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('NextAuth Configuration', () => {
  const mockCompare = compare as jest.MockedFunction<typeof compare>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider', () => {
    const credentialsProvider = authOptions.providers[0] as any;
    
    it('should authenticate valid credentials', async () => {
      mockCompare.mockResolvedValue(true);
      
      const result = await credentialsProvider.options.authorize({
        email: 'admin@docbits.com',
        password: 'admin123',
      }, {} as any);

      expect(result).toEqual({
        id: '1',
        email: 'admin@docbits.com',
        name: 'Admin User',
        role: 'admin',
      });
    });

    it('should reject invalid password', async () => {
      mockCompare.mockResolvedValue(false);
      
      await expect(
        credentialsProvider.options.authorize({
          email: 'admin@docbits.com',
          password: 'wrongpassword',
        }, {} as any)
      ).rejects.toThrow('Ungültige Anmeldedaten');
    });

    it('should reject non-existent user', async () => {
      await expect(
        credentialsProvider.options.authorize({
          email: 'notexist@docbits.com',
          password: 'password',
        }, {} as any)
      ).rejects.toThrow('Ungültige Anmeldedaten');
    });

    it('should reject missing email', async () => {
      await expect(
        credentialsProvider.options.authorize({
          email: '',
          password: 'password',
        }, {} as any)
      ).rejects.toThrow('Bitte Email und Passwort eingeben');
    });

    it('should reject missing password', async () => {
      await expect(
        credentialsProvider.options.authorize({
          email: 'admin@docbits.com',
          password: '',
        }, {} as any)
      ).rejects.toThrow('Bitte Email und Passwort eingeben');
    });
  });

  describe('JWT Callbacks', () => {
    it('should add user data to JWT on sign in', async () => {
      const token = await authOptions.callbacks!.jwt!({
        token: { sub: '1' },
        user: {
          id: '1',
          email: 'admin@docbits.com',
          name: 'Admin User',
          role: 'admin',
        },
        account: null,
        profile: undefined,
        isNewUser: undefined,
      });

      expect(token).toEqual({
        sub: '1',
        role: 'admin',
        id: '1',
      });
    });

    it('should preserve token data when no user', async () => {
      const existingToken = {
        sub: '1',
        role: 'admin',
        id: '1',
      };

      const token = await authOptions.callbacks!.jwt!({
        token: existingToken,
        user: undefined,
        account: null,
        profile: undefined,
        isNewUser: undefined,
      });

      expect(token).toEqual(existingToken);
    });
  });

  describe('Session Callback', () => {
    it('should add role and id to session', async () => {
      const session = await authOptions.callbacks!.session!({
        session: {
          user: {
            name: 'Admin User',
            email: 'admin@docbits.com',
          },
          expires: new Date().toISOString(),
        },
        token: {
          sub: '1',
          role: 'admin',
          id: '1',
        },
        user: undefined,
      });

      expect(session.user).toEqual({
        name: 'Admin User',
        email: 'admin@docbits.com',
        role: 'admin',
        id: '1',
      });
    });
  });

  describe('Configuration', () => {
    it('should have correct session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it('should have correct page routes', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/signin');
      expect(authOptions.pages?.error).toBe('/auth/error');
    });
  });
});
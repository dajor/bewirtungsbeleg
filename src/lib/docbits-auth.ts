/**
 * DocBits OAuth2 Authentication Client
 *
 * Handles authentication with DocBits API:
 * - OAuth2 login with password grant
 * - User registration
 * - Profile management
 * - Token refresh
 */

import { env } from './env';

const AUTH_SERVER = env.AUTH_SERVER;

export interface DocBitsUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id?: string;
  created_at?: string;
}

export interface DocBitsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface DocBitsLoginRequest {
  email: string;
  password: string;
}

export interface DocBitsRegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export class DocBitsAuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'DocBitsAuthError';
  }
}

/**
 * Login user with magic link (passwordless authentication)
 * Note: This creates a temporary password for the user or uses a special grant type
 */
export async function docbitsMagicLinkLogin(
  email: string
): Promise<{ token: DocBitsTokenResponse; user: DocBitsUser }> {
  try {
    // For magic link, we need to use a special endpoint or grant type
    // Since DocBits OAuth2 requires password grant, we'll need to either:
    // 1. Have DocBits support magic_link grant type
    // 2. Generate a temporary password server-side
    // 3. Use a special API endpoint for magic link authentication

    // For now, throwing an error indicating this needs DocBits backend support
    throw new DocBitsAuthError(
      'Magic Link authentication requires DocBits backend support for passwordless login',
      501,
      'NOT_IMPLEMENTED'
    );
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler bei der Magic Link Anmeldung',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Login user with email and password using OAuth2 password grant
 */
export async function docbitsLogin(
  credentials: DocBitsLoginRequest
): Promise<{ token: DocBitsTokenResponse; user: DocBitsUser }> {
  try {
    // Validate client credentials are configured
    if (!env.DOCBITS_CLIENT_ID || !env.DOCBITS_CLIENT_SECRET) {
      throw new DocBitsAuthError(
        'DocBits OAuth2 client credentials not configured. Please set DOCBITS_CLIENT_ID and DOCBITS_CLIENT_SECRET environment variables.',
        500,
        'MISSING_CLIENT_CREDENTIALS'
      );
    }

    // Create Basic Auth header: base64(client_id:client_secret)
    const basicAuth = Buffer.from(`${env.DOCBITS_CLIENT_ID}:${env.DOCBITS_CLIENT_SECRET}`).toString('base64');

    // Step 1: Get access token using OAuth2 password grant with Basic Authentication
    const tokenResponse = await fetch(`${AUTH_SERVER}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: credentials.email,
        password: credentials.password,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new DocBitsAuthError(
        errorData.error_description || 'Login fehlgeschlagen',
        tokenResponse.status,
        errorData.error
      );
    }

    const token: DocBitsTokenResponse = await tokenResponse.json();

    // Step 2: Get user profile with access token
    const profileResponse = await fetch(`${AUTH_SERVER}/oauth2/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      throw new DocBitsAuthError(
        'Fehler beim Abrufen des Benutzerprofils',
        profileResponse.status
      );
    }

    const user: DocBitsUser = await profileResponse.json();

    return { token, user };
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler bei der Anmeldung',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Check if email already exists in DocBits
 * Uses a temporary registration attempt to detect existing users
 *
 * @param email - Email address to check
 * @returns true if email exists, false if available
 */
export async function docbitsEmailExists(email: string): Promise<boolean> {
  try {
    // Attempt to create user with invalid/temporary data
    // If email exists, DocBits will return 409 Conflict
    const response = await fetch(`${AUTH_SERVER}/user/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: '__CHECK_ONLY__',  // Invalid password - won't actually create user
        first_name: '__CHECK__',
        last_name: '__ONLY__',
        role: 'user',
      }),
    });

    // If we get 409, user already exists
    if (response.status === 409) {
      return true;
    }

    // If we get 400, it might be validation error (email available but invalid request)
    // In this case, we'll treat it as "email available" since we're just checking
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      // If error specifically says user exists, return true
      if (errorData.code === 'USER_EXISTS') {
        return true;
      }
      // Otherwise, email is available (validation failed for other reasons)
      return false;
    }

    // Any other status code: assume email is available (fail open)
    return false;
  } catch (error) {
    console.warn('[DocBits] Email existence check failed:', error);
    // On network error, fail open (assume email available)
    // This prevents blocking registrations if DocBits is temporarily unavailable
    return false;
  }
}

/**
 * Register a new user
 */
export async function docbitsRegister(
  data: DocBitsRegisterRequest
): Promise<DocBitsUser> {
  try {
    const response = await fetch(`${AUTH_SERVER}/user/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        role: 'user', // Default role for new registrations
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle common registration errors
      if (response.status === 409 || errorData.code === 'USER_EXISTS') {
        throw new DocBitsAuthError(
          'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
          409,
          'USER_EXISTS'
        );
      }

      throw new DocBitsAuthError(
        errorData.message || 'Registrierung fehlgeschlagen',
        response.status,
        errorData.code
      );
    }

    const user: DocBitsUser = await response.json();
    return user;
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler bei der Registrierung',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Get user profile by access token
 */
export async function docbitsGetProfile(
  accessToken: string
): Promise<DocBitsUser> {
  try {
    const response = await fetch(`${AUTH_SERVER}/oauth2/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new DocBitsAuthError(
        'Fehler beim Abrufen des Profils',
        response.status
      );
    }

    const user: DocBitsUser = await response.json();
    return user;
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler beim Abrufen des Profils',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Update user profile
 */
export async function docbitsUpdateProfile(
  accessToken: string,
  userId: string,
  updates: Partial<Pick<DocBitsUser, 'first_name' | 'last_name' | 'email'>>
): Promise<DocBitsUser> {
  try {
    const response = await fetch(`${AUTH_SERVER}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DocBitsAuthError(
        errorData.message || 'Fehler beim Aktualisieren des Profils',
        response.status,
        errorData.code
      );
    }

    const user: DocBitsUser = await response.json();
    return user;
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler beim Aktualisieren des Profils',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Refresh access token using refresh token
 */
export async function docbitsRefreshToken(
  refreshToken: string
): Promise<DocBitsTokenResponse> {
  try {
    // Validate client credentials are configured
    if (!env.DOCBITS_CLIENT_ID || !env.DOCBITS_CLIENT_SECRET) {
      throw new DocBitsAuthError(
        'DocBits OAuth2 client credentials not configured',
        500,
        'MISSING_CLIENT_CREDENTIALS'
      );
    }

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${env.DOCBITS_CLIENT_ID}:${env.DOCBITS_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${AUTH_SERVER}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new DocBitsAuthError(
        'Token-Aktualisierung fehlgeschlagen',
        response.status
      );
    }

    const token: DocBitsTokenResponse = await response.json();
    return token;
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    throw new DocBitsAuthError(
      'Netzwerkfehler bei der Token-Aktualisierung',
      500,
      'NETWORK_ERROR'
    );
  }
}

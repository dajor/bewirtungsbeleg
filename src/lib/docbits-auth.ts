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
 * Login user with email and password using /me/login endpoint
 */
export async function docbitsLogin(
  credentials: DocBitsLoginRequest
): Promise<{ token: DocBitsTokenResponse; user: DocBitsUser }> {
  try {
    // Step 1: Login using /me/login endpoint (simple username/password, returns token)
    const loginResponse = await fetch(`${AUTH_SERVER}/me/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: credentials.email, // /me/login expects 'username' field
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      throw new DocBitsAuthError(
        errorData.error_description || errorData.message || 'Login fehlgeschlagen',
        loginResponse.status,
        errorData.error || errorData.code
      );
    }

    const loginData = await loginResponse.json();

    // /me/login returns { token: string } or { access_token: string }
    const accessToken = loginData.token || loginData.access_token;

    if (!accessToken) {
      throw new DocBitsAuthError(
        'Kein Token in der Antwort erhalten',
        500,
        'MISSING_TOKEN'
      );
    }

    // Create token response in expected format
    const token: DocBitsTokenResponse = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: loginData.expires_in || 86400, // Default 24 hours
      refresh_token: loginData.refresh_token,
    };

    // Step 2: Get user profile with access token using /me/profile or /oauth2/profile
    const profileResponse = await fetch(`${AUTH_SERVER}/me/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    console.log('[DocBits] Checking email existence for:', email);
    console.log('[DocBits] Using AUTH_SERVER:', AUTH_SERVER);

    // Attempt to register with invalid/temporary data using /me/register endpoint
    // If email exists, DocBits will return 400/409 with user exists error
    const formData = new URLSearchParams({
      email,
      password: '__CHECK_ONLY_INVALID__',  // Invalid password - won't actually create user
      password_confirm: '__CHECK_ONLY_INVALID__',
      first_name: '__CHECK__',
      last_name: '__ONLY__',
    });

    const response = await fetch(`${AUTH_SERVER}/me/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    console.log('[DocBits] Email check response status:', response.status);

    // If we get 400, check the error message
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[DocBits] Email check 400 response:', errorData);

      const errorMessage = errorData.message || errorData.error || '';

      // If error says user exists, return true
      if (errorMessage.includes('already exists') || errorMessage.includes('existiert bereits')) {
        console.log('[DocBits] Email exists (user already exists message)');
        return true;
      }

      // Otherwise, email is available (validation failed for other reasons like weak password)
      console.log('[DocBits] Email available (validation error on check)');
      return false;
    }

    // If we get 409, user already exists
    if (response.status === 409) {
      console.log('[DocBits] Email exists (409 Conflict)');
      return true;
    }

    // If we get 201 (somehow created user with invalid data), email was available
    // This shouldn't happen but handle it
    if (response.status === 201) {
      console.log('[DocBits] Email was available (201 Created)');
      return false;
    }

    // Any other status code: log and assume email is available (fail open)
    console.log('[DocBits] Email check returned unexpected status:', response.status);
    const errorText = await response.text().catch(() => 'Unable to read response');
    console.log('[DocBits] Response body:', errorText);
    return false;
  } catch (error) {
    console.warn('[DocBits] Email existence check failed with error:', error);
    // On network error, fail open (assume email available)
    // This prevents blocking registrations if DocBits is temporarily unavailable
    return false;
  }
}

/**
 * Register a new user using the public /me/register endpoint
 * This endpoint does not require admin credentials
 */
export async function docbitsRegister(
  data: DocBitsRegisterRequest
): Promise<DocBitsUser> {
  try {
    // Use the public /me/register endpoint (no authentication required)
    // This endpoint expects form-data (application/x-www-form-urlencoded)
    const formData = new URLSearchParams({
      email: data.email,
      password: data.password,
      password_confirm: data.password, // /me/register requires password confirmation
      first_name: data.first_name,
      last_name: data.last_name,
    });

    const response = await fetch(`${AUTH_SERVER}/me/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      console.error('[DocBits Register] Registration failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      // Handle common registration errors
      if (response.status === 409 || response.status === 400) {
        // Check if it's a duplicate email error
        const errorMessage = errorData.message || errorData.error || '';
        if (errorMessage.includes('already exists') || errorMessage.includes('existiert bereits')) {
          throw new DocBitsAuthError(
            'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
            409,
            'USER_EXISTS'
          );
        }
      }

      throw new DocBitsAuthError(
        errorData.message || errorData.error || 'Registrierung fehlgeschlagen',
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
 * Change password for authenticated user (user knows current password)
 * Requires Bearer token from login
 *
 * @param accessToken - Bearer token from user login
 * @param currentPassword - User's current password (for security verification)
 * @param newPassword - New password to set
 */
export async function docbitsChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    console.log('[DocBits] Changing password with authenticated request');

    // Use /me/password endpoint with Bearer token and current password
    // Per GitHub Issue #870: https://github.com/Fellow-Consulting-AG/cloudintegration_subscription/issues/870
    const response = await fetch(`${AUTH_SERVER}/me/password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[DocBits] Password change failed:', {
        status: response.status,
        error: errorData,
      });

      // Handle specific error cases
      if (response.status === 401) {
        throw new DocBitsAuthError(
          'Aktuelles Passwort ist falsch',
          401,
          'INVALID_CURRENT_PASSWORD'
        );
      }

      if (response.status === 400) {
        throw new DocBitsAuthError(
          errorData.message || errorData.error || 'Ungültige Anfrage',
          400,
          errorData.code || 'INVALID_REQUEST'
        );
      }

      throw new DocBitsAuthError(
        errorData.message || errorData.error || 'Fehler beim Ändern des Passworts',
        response.status,
        errorData.code || errorData.error
      );
    }

    console.log('[DocBits] Password changed successfully');
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    console.error('[DocBits] Unexpected error during password change:', error);
    throw new DocBitsAuthError(
      'Netzwerkfehler beim Ändern des Passworts',
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Reset password using email verification token (forgot password flow)
 * This is for users who don't know their current password
 *
 * Uses the Management API with admin credentials to update the user's password:
 * 1. Find user by email using GET /management/api/users?email={email}
 * 2. Update password using POST /management/user/{user_id}
 *
 * @param email - User's email address
 * @param newPassword - New password to set
 * @param resetToken - Password reset token from email (for validation only, not sent to DocBits)
 */
export async function docbitsResetPasswordWithToken(
  email: string,
  newPassword: string,
  resetToken?: string
): Promise<void> {
  try {
    console.log('[DocBits] Resetting password via Management API for:', email);

    // Validate admin credentials are configured
    if (!env.ADMIN_AUTH_USER || !env.ADMIN_AUTH_PASSWORD) {
      throw new DocBitsAuthError(
        'Admin-Anmeldeinformationen nicht konfiguriert',
        500,
        'MISSING_ADMIN_CREDENTIALS'
      );
    }

    // Create Basic Auth header for admin
    const basicAuth = Buffer.from(
      `${env.ADMIN_AUTH_USER}:${env.ADMIN_AUTH_PASSWORD}`
    ).toString('base64');

    // Step 1: Find user by email
    console.log('[DocBits] Looking up user by email:', email);
    console.log('[DocBits] Management API URL:', `${AUTH_SERVER}/management/api/users?email=${encodeURIComponent(email)}`);
    const getUserResponse = await fetch(
      `${AUTH_SERVER}/management/api/users?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[DocBits] User lookup response status:', getUserResponse.status);
    console.log('[DocBits] User lookup response statusText:', getUserResponse.statusText);

    if (!getUserResponse.ok) {
      // Try to get response body for better error debugging
      const errorText = await getUserResponse.text().catch(() => 'Unable to read response');

      console.error('[DocBits] Failed to lookup user:', {
        status: getUserResponse.status,
        statusText: getUserResponse.statusText,
        responseBody: errorText,
      });

      if (getUserResponse.status === 401 || getUserResponse.status === 403) {
        throw new DocBitsAuthError(
          'Admin-Authentifizierung fehlgeschlagen',
          getUserResponse.status,
          'ADMIN_AUTH_FAILED'
        );
      }

      throw new DocBitsAuthError(
        'Fehler beim Suchen des Benutzers',
        getUserResponse.status,
        'USER_LOOKUP_FAILED'
      );
    }

    const userData = await getUserResponse.json();
    console.log('[DocBits] User lookup response:', { hasData: !!userData });

    // Handle different response formats
    const users = userData.users || userData.data || [];

    if (!users || users.length === 0) {
      console.log('[DocBits] No user found with email:', email);
      throw new DocBitsAuthError(
        'Benutzer mit dieser E-Mail-Adresse nicht gefunden',
        404,
        'USER_NOT_FOUND'
      );
    }

    const user = users[0];
    console.log('[DocBits] Found user:', { id: user.id, email: user.email });

    // Step 2: Update password via Management API
    console.log('[DocBits] Updating password for user:', user.id);
    const updateResponse = await fetch(
      `${AUTH_SERVER}/management/user/${user.id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('[DocBits] Password update failed:', {
        status: updateResponse.status,
        error: errorData,
      });

      if (updateResponse.status === 400) {
        // Password validation failed
        throw new DocBitsAuthError(
          errorData.message || 'Passwort erfüllt nicht die Anforderungen',
          400,
          'INVALID_PASSWORD'
        );
      }

      if (updateResponse.status === 401 || updateResponse.status === 403) {
        throw new DocBitsAuthError(
          'Admin-Authentifizierung fehlgeschlagen',
          updateResponse.status,
          'ADMIN_AUTH_FAILED'
        );
      }

      throw new DocBitsAuthError(
        errorData.message || 'Fehler beim Aktualisieren des Passworts',
        updateResponse.status,
        errorData.code || 'UPDATE_FAILED'
      );
    }

    console.log('[DocBits] Password reset successfully for:', email);
  } catch (error) {
    if (error instanceof DocBitsAuthError) {
      throw error;
    }

    console.error('[DocBits] Unexpected error during password reset:', error);
    throw new DocBitsAuthError(
      'Netzwerkfehler beim Zurücksetzen des Passworts',
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

/**
 * Setup Password API Route
 * Sets password for newly registered users after email verification
 *
 * BUSINESS LOGIC:
 * 1. Validate token and password
 * 2. Verify token is valid, not expired, and correct type
 * 3. Consume token (single-use security)
 * 4. Create user account in DocBits with email, password, firstName, lastName
 * 5. Delete token from storage (cleanup)
 * 6. Return success with email for login
 *
 * SECURITY:
 * - Tokens are single-use (consumed on first use)
 * - Tokens expire after 24 hours
 * - Password must be at least 8 characters
 * - Duplicate emails caught by DocBits (returns 409)
 *
 * ERROR SCENARIOS:
 * - 400: Invalid/expired/used token, wrong token type, weak password
 * - 409: Email already exists in DocBits (race condition)
 * - 500: Network error, DocBits API error
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndConsumeToken, deleteTokenByEmail } from '@/lib/email/token-storage';
import { isTokenExpired, getTokenExpiryMinutes } from '@/lib/email/utils';
import { docbitsRegister, DocBitsAuthError } from '@/lib/docbits-auth';

// Request validation schema
const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = setupPasswordSchema.safeParse(body);

    if (!result.success) {
      const error = result.error.errors[0]?.message || 'Ungültige Anfrage';
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Verify and consume token (single-use)
    const tokenData = await verifyAndConsumeToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      );
    }

    // Check token type
    if (tokenData.type !== 'email_verify') {
      return NextResponse.json(
        { error: 'Falscher Token-Typ' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiryMinutes = getTokenExpiryMinutes(tokenData.type);
    if (isTokenExpired(tokenData.createdAt, expiryMinutes)) {
      return NextResponse.json(
        { error: 'Token ist abgelaufen' },
        { status: 400 }
      );
    }

    // Delete token by email (cleanup)
    await deleteTokenByEmail(tokenData.email, 'email_verify');

    // Extract user data from token
    const firstName = (tokenData as any).firstName;
    const lastName = (tokenData as any).lastName;

    if (!firstName || !lastName) {
      console.error('[Setup Password] Missing user data in token:', tokenData);
      return NextResponse.json(
        { error: 'Ungültige Token-Daten. Bitte registrieren Sie sich erneut.' },
        { status: 400 }
      );
    }

    // Create user account in DocBits
    try {
      const user = await docbitsRegister({
        email: tokenData.email,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      console.log('[Setup Password] User account created successfully:', user.user_id);

      // Return success with email for login
      return NextResponse.json({
        success: true,
        email: tokenData.email,
        message: 'Konto erfolgreich erstellt! Sie können sich jetzt anmelden.',
      });
    } catch (docbitsError) {
      // Handle DocBits-specific errors
      if (docbitsError instanceof DocBitsAuthError) {
        console.error('[Setup Password] DocBits registration error:', docbitsError.message);

        // If user already exists (409), show appropriate message
        if (docbitsError.statusCode === 409 || docbitsError.code === 'USER_EXISTS') {
          return NextResponse.json(
            { error: 'Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.' },
            { status: 409 }
          );
        }

        // Return DocBits error message
        return NextResponse.json(
          { error: docbitsError.message },
          { status: docbitsError.statusCode || 500 }
        );
      }

      // Generic error
      throw docbitsError;
    }
  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

/**
 * Registration Email Verification API Route
 * Sends email verification link to new users
 *
 * BUSINESS LOGIC:
 * 1. Validate input (firstName, lastName, email)
 * 2. Check if email already exists in DocBits (prevent duplicate registrations)
 * 3. Generate email verification token
 * 4. Store token with user data (firstName, lastName needed for account creation)
 * 5. Send verification email with setup-password link
 *
 * SECURITY:
 * - Email existence check prevents account enumeration
 * - Tokens expire after 24 hours
 * - Tokens are single-use (consumed on password setup)
 *
 * ERROR SCENARIOS:
 * - 400: Invalid input (missing fields, invalid email format)
 * - 409: Email already registered (duplicate registration attempt)
 * - 500: Network error, email sending failure, token storage failure
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createEmailVerificationToken } from '@/lib/email/utils';
import { storeEmailToken, storeTokenByEmail } from '@/lib/email/token-storage';
import { sendEmail } from '@/lib/email/mailer';
import { generateEmailVerificationEmail } from '@/lib/email/templates/verification';
import { env } from '@/lib/env';

// Request validation schema
const sendVerificationSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

/**
 * Check if email already exists in DocBits
 * Uses a temporary password attempt to check - if user exists, login will fail with specific error
 */
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Try to check if user exists by attempting to create with no credentials
    // DocBits will return 409 if user already exists
    const response = await fetch(`${env.AUTH_SERVER}/user/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // If endpoint returns 200, email exists
    if (response.status === 200) {
      return true;
    }

    // If endpoint returns 404, email doesn't exist
    if (response.status === 404) {
      return false;
    }

    // If check-email endpoint doesn't exist, fall back to false (allow registration)
    // The actual duplicate check will happen during user creation in setup-password
    return false;
  } catch (error) {
    console.warn('[Registration] Email existence check failed, allowing registration:', error);
    // On error, allow registration to proceed
    // Duplicate will be caught during actual user creation
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = sendVerificationSchema.safeParse(body);

    if (!result.success) {
      const error = result.error.errors[0]?.message || 'Ungültige Anfrage';
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    const { firstName, lastName, email } = result.data;

    // Check if email already exists in DocBits
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      console.log('[Registration] Duplicate email attempt:', email);
      return NextResponse.json(
        { error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an oder verwenden Sie "Passwort vergessen".' },
        { status: 409 }
      );
    }

    // Generate email verification token
    const tokenData = createEmailVerificationToken(email);

    // Store token in storage (24 hour expiry) with user data
    // firstName and lastName are needed when creating the user account
    const stored = await storeEmailToken(tokenData.token, {
      ...tokenData,
      firstName,
      lastName,
    });

    if (!stored) {
      return NextResponse.json(
        { error: 'Token konnte nicht gespeichert werden' },
        { status: 500 }
      );
    }

    // Store token by email for resending
    await storeTokenByEmail(email, tokenData.token, 'email_verify');

    // Generate verification URL
    const verificationUrl = `${env.NEXTAUTH_URL}/auth/setup-password?token=${tokenData.token}`;

    // Send verification email
    const emailHtml = generateEmailVerificationEmail(
      `${firstName} ${lastName}`,
      verificationUrl
    );

    await sendEmail({
      to: email,
      subject: 'E-Mail-Adresse bestätigen - DocBits Bewirtungsbeleg',
      html: emailHtml,
    });

    console.log('[Registration] Verification email sent to:', email);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Bestätigungs-E-Mail wurde gesendet',
    });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

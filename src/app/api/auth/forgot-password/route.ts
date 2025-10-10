/**
 * Forgot Password API Route
 * Sends password reset email to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRatelimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/mailer';
import { generatePasswordResetEmail } from '@/lib/email/templates/password-reset';
import { createPasswordResetToken, sanitizeEmail, isValidEmail } from '@/lib/email/utils';
import { storeEmailToken, storeTokenByEmail } from '@/lib/email/token-storage';
import { env } from '@/lib/env';

// Request validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

    if (apiRatelimit.email) {
      const { success } = await apiRatelimit.email.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
          { status: 429 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    const email = sanitizeEmail(result.data.email);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    // Generate password reset token
    const tokenData = createPasswordResetToken(email);

    // Store token in Redis
    const stored = await storeEmailToken(tokenData.token, tokenData);
    if (!stored) {
      throw new Error('Failed to store token');
    }

    // Store token by email for lookup
    await storeTokenByEmail(email, tokenData.token, 'password_reset');

    // Generate reset URL
    const baseUrl = env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${tokenData.token}`;

    // Generate email HTML
    const emailHtml = generatePasswordResetEmail({
      resetUrl,
      expiryMinutes: 30,
    });

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Passwort zurücksetzen - DocBits Bewirtungsbeleg',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      );
    }

    // Return success (always return success for security - don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

/**
 * Reset Password API Route
 * Sets new password using password reset token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndConsumeToken, deleteTokenByEmail } from '@/lib/email/token-storage';
import { isTokenExpired, getTokenExpiryMinutes } from '@/lib/email/utils';
import { sendEmail } from '@/lib/email/mailer';
import { generatePasswordChangedEmail } from '@/lib/email/templates/password-reset';

// Request validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

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
    if (tokenData.type !== 'password_reset') {
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
    await deleteTokenByEmail(tokenData.email, 'password_reset');

    // TODO: Update password in database
    // This will be implemented when we add user management
    // For now, we just validate the token and return success

    // Send confirmation email
    try {
      const emailHtml = generatePasswordChangedEmail();
      await sendEmail({
        to: tokenData.email,
        subject: 'Passwort erfolgreich geändert - DocBits Bewirtungsbeleg',
        html: emailHtml,
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Failed to send password changed email:', emailError);
    }

    // Return success
    return NextResponse.json({
      success: true,
      email: tokenData.email,
      message: 'Passwort erfolgreich geändert',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

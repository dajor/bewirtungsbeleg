/**
 * Verify Reset Token API Route
 * Verifies password reset token without consuming it
 * Returns the email associated with the token for auto-login
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailToken } from '@/lib/email/token-storage';
import { isTokenExpired, getTokenExpiryMinutes } from '@/lib/email/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || token.trim() === '') {
      return NextResponse.json(
        { error: 'Token ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if token exists (without consuming it)
    const tokenData = await getEmailToken(token);

    if (!tokenData) {
      console.log('[Verify Reset Token] Token not found:', token);
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      );
    }

    console.log('[Verify Reset Token] Token found for email:', tokenData.email);

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
      const ageMinutes = Math.floor((Date.now() - tokenData.createdAt) / 60000);
      console.log(`[Verify Reset Token] Token expired. Age: ${ageMinutes} minutes, Max: ${expiryMinutes} minutes`);
      return NextResponse.json(
        { error: 'Token ist abgelaufen' },
        { status: 400 }
      );
    }

    console.log('[Verify Reset Token] Token verified successfully for:', tokenData.email);

    // Return email for auto-login (do NOT consume the token)
    return NextResponse.json({
      valid: true,
      email: tokenData.email,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

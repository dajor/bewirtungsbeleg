/**
 * Magic Link Verify API Route
 * Verifies magic link token and creates session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailToken, deleteEmailToken, deleteTokenByEmail } from '@/lib/email/token-storage';
import { isTokenExpired, getTokenExpiryMinutes } from '@/lib/email/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || token.trim() === '') {
      // Redirect to signin with error
      return NextResponse.redirect(
        new URL('/auth/anmelden?error=MissingToken', request.url)
      );
    }

    // First check if token exists (without consuming it yet)
    const tokenData = await getEmailToken(token);

    if (!tokenData) {
      console.log('[Magic Link Verify] Token not found or already used:', token);
      // Token doesn't exist - either invalid or already consumed
      return NextResponse.redirect(
        new URL('/auth/anmelden?error=TokenAlreadyUsed', request.url)
      );
    }

    console.log('[Magic Link Verify] Token verified for email:', tokenData.email);

    // Check token type
    if (tokenData.type !== 'magic_link') {
      return NextResponse.redirect(
        new URL('/auth/anmelden?error=InvalidToken', request.url)
      );
    }

    // Check if token is expired
    const expiryMinutes = getTokenExpiryMinutes(tokenData.type);
    if (isTokenExpired(tokenData.createdAt, expiryMinutes)) {
      const ageMinutes = Math.floor((Date.now() - tokenData.createdAt) / 60000);
      console.log(`[Magic Link Verify] Token expired. Age: ${ageMinutes} minutes, Max: ${expiryMinutes} minutes`);
      return NextResponse.redirect(
        new URL('/auth/anmelden?error=TokenExpired', request.url)
      );
    }

    // Now consume the token (delete it to prevent reuse)
    await deleteEmailToken(token);
    await deleteTokenByEmail(tokenData.email, 'magic_link');

    console.log('[Magic Link Verify] Token consumed successfully for:', tokenData.email);

    // Magic link verified successfully!
    // Redirect to auth callback that will create the NextAuth session
    // The /auth/callback/magic-link endpoint will handle session creation
    return NextResponse.redirect(
      new URL(`/auth/callback/magic-link?email=${encodeURIComponent(tokenData.email)}`, request.url)
    );
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.redirect(
      new URL('/auth/anmelden?error=VerificationFailed', request.url)
    );
  }
}

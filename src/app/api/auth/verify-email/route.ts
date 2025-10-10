/**
 * Verify Email API Route
 * Verifies user's email address using token
 *
 * Supports both GET (with query param) and POST (with body) for frontend compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailToken } from '@/lib/email/token-storage';
import { isTokenExpired, getTokenExpiryMinutes } from '@/lib/email/utils';

// Request validation schema
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
});

// Shared verification logic
async function verifyEmailToken(token: string) {
  // Get token WITHOUT consuming it (setup-password will consume it)
  const tokenData = await getEmailToken(token);

  if (!tokenData) {
    return NextResponse.json(
      { error: 'Ungültiger oder abgelaufener Verifizierungstoken' },
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
      { error: 'Verifizierungstoken ist abgelaufen' },
      { status: 400 }
    );
  }

  // DO NOT delete token here - setup-password route will consume it!
  // This endpoint is just for validation before showing the password form.

  // Return success with email address
  return NextResponse.json({
    success: true,
    email: tokenData.email,
    message: 'E-Mail-Adresse erfolgreich bestätigt',
  });
}

// GET handler - frontend calls this with query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token ist erforderlich' },
        { status: 400 }
      );
    }

    return await verifyEmailToken(token);
  } catch (error) {
    console.error('Verify email GET error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

// POST handler - kept for backward compatibility
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültiger Verifizierungstoken' },
        { status: 400 }
      );
    }

    const { token } = result.data;
    return await verifyEmailToken(token);
  } catch (error) {
    console.error('Verify email POST error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

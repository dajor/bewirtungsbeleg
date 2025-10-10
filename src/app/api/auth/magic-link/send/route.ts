/**
 * Magic Link Send API Route
 * Sends magic link email for passwordless authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRatelimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/mailer';
import { generateMagicLinkEmail } from '@/lib/email/templates/magic-link';
import { createMagicLinkToken, sanitizeEmail, isValidEmail } from '@/lib/email/utils';
import { storeEmailToken, storeTokenByEmail } from '@/lib/email/token-storage';
import { env } from '@/lib/env';

// Request validation schema
const magicLinkSchema = z.object({
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
    const result = magicLinkSchema.safeParse(body);

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

    // Generate magic link token
    const tokenData = createMagicLinkToken(email);

    // Store token in Redis
    const stored = await storeEmailToken(tokenData.token, tokenData);
    if (!stored) {
      throw new Error('Failed to store token');
    }

    // Store token by email for lookup
    await storeTokenByEmail(email, tokenData.token, 'magic_link');

    // Generate magic link URL
    const baseUrl = env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${tokenData.token}`;

    console.log('[Magic Link Send] Base URL:', baseUrl);
    console.log('[Magic Link Send] Full URL:', magicLinkUrl);

    // Generate email HTML
    const emailHtml = generateMagicLinkEmail({
      magicLinkUrl,
      expiryMinutes: 10,
    });

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Ihr Anmelde-Link - DocBits Bewirtungsbeleg',
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error);
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.' },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Ein Anmelde-Link wurde an Ihre E-Mail-Adresse gesendet.',
    });
  } catch (error) {
    console.error('Magic link send error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

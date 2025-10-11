/**
 * MailerSend Webhook Endpoint for Password Reset E2E Testing
 *
 * This endpoint receives webhook notifications from MailerSend
 * when password reset emails are sent.
 * Stores email content in memory for Playwright tests to retrieve.
 *
 * Webhook Configuration:
 * - Inbound Email: yzwmdjgob38u0x4txzzv@inbound.mailersend.net
 * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/password-forget
 * - Secret: LTgupNfVt0ibdUnv8DT3SPeaEE1oRUT4
 */

import { NextRequest, NextResponse } from 'next/server';

interface StoredEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  receivedAt: Date;
  resetLink?: string;
}

// In-memory storage for received emails (expires after 5 minutes)
const emailStorage = new Map<string, StoredEmail>();

// Cleanup old emails periodically
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const WEBHOOK_SECRET = 'LTgupNfVt0ibdUnv8DT3SPeaEE1oRUT4';

function cleanupExpiredEmails() {
  const now = Date.now();
  for (const [email, stored] of Array.from(emailStorage.entries())) {
    if (now - stored.receivedAt.getTime() > EXPIRY_MS) {
      emailStorage.delete(email);
    }
  }
}

/**
 * Extract password reset link from email HTML
 */
function extractResetLink(html: string, text: string): string | undefined {
  // Try HTML first - look for /auth/reset-password?token= link
  const htmlMatch = html.match(/href=["']([^"']*\/auth\/reset-password\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text - look for URL pattern
  const textMatch = text.match(/(https?:\/\/[^\s]+\/auth\/reset-password\?token=[^\s]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return undefined;
}

/**
 * Verify webhook signature/secret
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  const signature = request.headers.get('x-mailersend-signature');
  const secret = request.headers.get('x-mailersend-secret');

  // In development, allow requests without signature
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return secret === WEBHOOK_SECRET || signature === WEBHOOK_SECRET;
}

/**
 * POST - Receive webhook from MailerSend
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret in production
    if (!verifyWebhookSecret(request)) {
      console.error('❌ Password Reset Webhook: Invalid secret');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();

    // MailerSend webhook structure:
    // https://developers.mailersend.com/webhooks.html
    const { type, data } = body;

    // We're interested in activity.sent events
    if (type === 'activity.sent') {
      const { email } = data;
      const recipient = email?.recipient?.[0]?.email || email?.to;
      const subject = email?.subject || '';
      const html = email?.html || '';
      const text = email?.text || '';

      if (recipient) {
        // Extract password reset link
        const resetLink = extractResetLink(html, text);

        // Store email
        emailStorage.set(recipient, {
          to: recipient,
          subject,
          html,
          text,
          receivedAt: new Date(),
          resetLink,
        });

        console.log(`📧 Password Reset Webhook - Email stored for: ${recipient}`);
        if (resetLink) {
          console.log(`🔗 Reset link extracted: ${resetLink.substring(0, 50)}...`);
        }

        // Cleanup old emails
        cleanupExpiredEmails();

        return NextResponse.json({
          success: true,
          message: 'Password reset email received and stored',
          hasResetLink: !!resetLink
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Password Reset Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook'
    }, { status: 500 });
  }
}

/**
 * GET - Retrieve stored email for testing
 * Query params: ?email=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required'
      }, { status: 400 });
    }

    // Cleanup expired emails first
    cleanupExpiredEmails();

    const stored = emailStorage.get(email);

    if (!stored) {
      return NextResponse.json({
        success: false,
        error: 'Email not found',
        message: 'No password reset email received for this address yet. Check MailerSend webhook configuration.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: stored,
      resetLink: stored.resetLink
    });
  } catch (error) {
    console.error('GET Password Reset Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve email'
    }, { status: 500 });
  }
}

/**
 * DELETE - Clear stored emails (for test cleanup)
 * Query params: ?email=test@example.com (optional - clears all if not provided)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      emailStorage.delete(email);
      return NextResponse.json({
        success: true,
        message: `Password reset email cleared for: ${email}`
      });
    } else {
      emailStorage.clear();
      return NextResponse.json({
        success: true,
        message: 'All password reset emails cleared'
      });
    }
  } catch (error) {
    console.error('DELETE Password Reset Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear emails'
    }, { status: 500 });
  }
}

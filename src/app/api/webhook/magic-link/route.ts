/**
 * MailerSend Webhook Endpoint for Magic Link E2E Testing
 *
 * This endpoint receives webhook notifications from MailerSend
 * when magic link emails are sent.
 * Stores email content in memory for Playwright tests to retrieve.
 *
 * Webhook Configuration:
 * - Inbound Email: hub1q1enbohud95ctosh@inbound.mailersend.net
 * - Webhook URL: https://dev.bewirtungsbeleg.docbits.com/webhook/magic-link
 * - Secret: Rbv4DdNeYzMkfxi2K11vJHYFNhlMiCcB
 */

import { NextRequest, NextResponse } from 'next/server';

interface StoredEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  receivedAt: Date;
  magicLink?: string;
}

// In-memory storage for received emails (expires after 5 minutes)
const emailStorage = new Map<string, StoredEmail>();

// Cleanup old emails periodically
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const WEBHOOK_SECRET = 'Rbv4DdNeYzMkfxi2K11vJHYFNhlMiCcB';

function cleanupExpiredEmails() {
  const now = Date.now();
  for (const [email, stored] of Array.from(emailStorage.entries())) {
    if (now - stored.receivedAt.getTime() > EXPIRY_MS) {
      emailStorage.delete(email);
    }
  }
}

/**
 * Extract magic link from email HTML
 */
function extractMagicLink(html: string, text: string): string | undefined {
  // Try HTML first - look for /api/auth/magic-link/verify?token= link
  const htmlMatch = html.match(/href=["']([^"']*\/api\/auth\/magic-link\/verify\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text - look for URL pattern
  const textMatch = text.match(/(https?:\/\/[^\s]+\/api\/auth\/magic-link\/verify\?token=[^\s]+)/i);
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
      console.error('❌ Magic Link Webhook: Invalid secret');
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
        // Extract magic link
        const magicLink = extractMagicLink(html, text);

        // Store email
        emailStorage.set(recipient, {
          to: recipient,
          subject,
          html,
          text,
          receivedAt: new Date(),
          magicLink,
        });

        console.log(`📧 Magic Link Webhook - Email stored for: ${recipient}`);
        if (magicLink) {
          console.log(`🔗 Magic link extracted: ${magicLink.substring(0, 50)}...`);
        }

        // Cleanup old emails
        cleanupExpiredEmails();

        return NextResponse.json({
          success: true,
          message: 'Magic link email received and stored',
          hasMagicLink: !!magicLink
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Magic Link Webhook error:', error);
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
        message: 'No magic link email received for this address yet. Check MailerSend webhook configuration.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: stored,
      magicLink: stored.magicLink
    });
  } catch (error) {
    console.error('GET Magic Link Webhook error:', error);
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
        message: `Magic link email cleared for: ${email}`
      });
    } else {
      emailStorage.clear();
      return NextResponse.json({
        success: true,
        message: 'All magic link emails cleared'
      });
    }
  } catch (error) {
    console.error('DELETE Magic Link Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear emails'
    }, { status: 500 });
  }
}

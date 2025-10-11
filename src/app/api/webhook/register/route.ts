/**
 * MailerSend Webhook Endpoint for E2E Testing
 *
 * This endpoint receives webhook notifications from MailerSend
 * when emails are sent to the test email address.
 * Stores email content in memory for Playwright tests to retrieve.
 */

import { NextRequest, NextResponse } from 'next/server';

interface StoredEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  receivedAt: Date;
  verificationLink?: string;
}

// In-memory storage for received emails (expires after 5 minutes)
const emailStorage = new Map<string, StoredEmail>();

// Cleanup old emails periodically
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function cleanupExpiredEmails() {
  const now = Date.now();
  for (const [email, stored] of emailStorage.entries()) {
    if (now - stored.receivedAt.getTime() > EXPIRY_MS) {
      emailStorage.delete(email);
    }
  }
}

/**
 * Extract verification link from email HTML
 */
function extractVerificationLink(html: string, text: string): string | undefined {
  // Try HTML first - look for /auth/setup-password?token= link
  const htmlMatch = html.match(/href=["']([^"']*\/auth\/setup-password\?token=[^"']*)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try plain text - look for URL pattern
  const textMatch = text.match(/(https?:\/\/[^\s]+\/auth\/setup-password\?token=[^\s]+)/i);
  if (textMatch) {
    return textMatch[1];
  }

  return undefined;
}

/**
 * POST - Receive webhook from MailerSend
 */
export async function POST(request: NextRequest) {
  try {
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
        // Extract verification link
        const verificationLink = extractVerificationLink(html, text);

        // Store email
        emailStorage.set(recipient, {
          to: recipient,
          subject,
          html,
          text,
          receivedAt: new Date(),
          verificationLink,
        });

        console.log(`📧 Webhook received - Email stored for: ${recipient}`);
        if (verificationLink) {
          console.log(`🔗 Verification link extracted: ${verificationLink.substring(0, 50)}...`);
        }

        // Cleanup old emails
        cleanupExpiredEmails();

        return NextResponse.json({
          success: true,
          message: 'Email received and stored',
          hasVerificationLink: !!verificationLink
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
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
        message: 'No email received for this address yet. Check MailerSend webhook configuration.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: stored,
      verificationLink: stored.verificationLink
    });
  } catch (error) {
    console.error('GET webhook error:', error);
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
        message: `Email cleared for: ${email}`
      });
    } else {
      emailStorage.clear();
      return NextResponse.json({
        success: true,
        message: 'All emails cleared'
      });
    }
  } catch (error) {
    console.error('DELETE webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear emails'
    }, { status: 500 });
  }
}

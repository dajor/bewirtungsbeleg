/**
 * MailerSend email service
 * Handles sending emails through MailerSend API
 */

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { env } from '@/lib/env';

// Initialize MailerSend client
const mailerSend = new MailerSend({
  apiKey: env.MAILERSEND_API_KEY,
});

// Default sender information
const DEFAULT_FROM_EMAIL = 'noreply@bewirtungsbeleg.docbits.com';
const DEFAULT_FROM_NAME = 'DocBits Bewirtungsbeleg';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using MailerSend
 * @param options - Email options (to, subject, html, etc.)
 * @returns SendEmailResult with success status
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const {
      to,
      toName,
      subject,
      html,
      text,
      from = DEFAULT_FROM_EMAIL,
      fromName = DEFAULT_FROM_NAME,
    } = options;

    // Create sender and recipient
    const sentFrom = new Sender(from, fromName);
    const recipients = [new Recipient(to, toName || to)];

    // Build email params
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    // Add plain text version if provided
    if (text) {
      emailParams.setText(text);
    }

    // Send email
    const response = await mailerSend.email.send(emailParams);

    return {
      success: true,
      messageId: response.body?.messageId || response.statusCode?.toString(),
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send multiple emails in batch
 * @param emails - Array of email options
 * @returns Array of SendEmailResult
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      error: result.reason?.message || 'Failed to send email',
    };
  });
}

/**
 * Extract plain text from HTML content (basic implementation)
 * @param html - HTML content
 * @returns Plain text version
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validate email configuration
 * @returns true if configured correctly
 */
export function validateEmailConfig(): boolean {
  return !!env.MAILERSEND_API_KEY && env.MAILERSEND_API_KEY.length > 0;
}

/**
 * Email verification template
 * Sent when a new user registers to verify their email address
 */

import {
  generateBaseEmail,
  generateButton,
  generateHeading,
  generateParagraph,
  generateInfoBox,
  type BaseEmailProps,
} from './base';

export interface EmailVerificationProps {
  userName?: string;
  verificationUrl: string;
  expiryHours?: number;
}

/**
 * Generate email verification email for new user registration
 * @param props - Email verification properties
 * @returns HTML email string
 */
export function generateEmailVerificationEmail(
  userName: string,
  verificationUrl: string,
  expiryHours: number = 24
): string {
  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading('Willkommen bei DocBits!')}

${generateParagraph(
  `${greeting}, vielen Dank für Ihre Registrierung bei DocBits Bewirtungsbeleg.`
)}

${generateParagraph(
  'Um Ihr Konto zu aktivieren und Ihr Passwort zu erstellen, bestätigen Sie bitte Ihre E-Mail-Adresse:'
)}

${generateButton('E-Mail bestätigen und Passwort erstellen', verificationUrl)}

${generateParagraph(
  `Dieser Bestätigungslink ist ${expiryHours} Stunden lang gültig.`
)}

${generateInfoBox(
  '<strong>Was passiert als nächstes?</strong><br>Nach der Bestätigung können Sie ein sicheres Passwort für Ihr Konto erstellen und sich dann direkt anmelden.'
)}

${generateParagraph(
  'Falls der Button nicht funktioniert, können Sie auch den folgenden Link kopieren und in Ihren Browser einfügen:'
)}

${generateParagraph(
  `<a href="${verificationUrl}" style="color: #228BE6; word-break: break-all;">${verificationUrl}</a>`
)}

${generateParagraph(
  'Wenn Sie sich nicht bei DocBits registriert haben, können Sie diese E-Mail einfach ignorieren.'
)}

${generateParagraph('Mit freundlichen Grüßen,<br>Ihr DocBits Team')}
  `.trim();

  return generateBaseEmail({
    title: 'E-Mail-Adresse bestätigen - DocBits',
    preheader: 'Bestätigen Sie Ihre E-Mail-Adresse und erstellen Sie Ihr Passwort',
    content,
  });
}

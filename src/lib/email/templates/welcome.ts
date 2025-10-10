/**
 * Welcome and email verification email template
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

export interface WelcomeEmailProps {
  userName?: string;
  verificationUrl: string;
  expiryHours?: number;
}

/**
 * Generate welcome email with email verification link
 * @param props - Welcome email properties
 * @returns HTML email string
 */
export function generateWelcomeEmail(props: WelcomeEmailProps): string {
  const { userName, verificationUrl, expiryHours = 24 } = props;

  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading(`${greeting}!`)}

${generateParagraph(
  'Willkommen bei DocBits Bewirtungsbeleg! Wir freuen uns, Sie an Bord zu haben.'
)}

${generateParagraph(
  'Um Ihr Konto zu aktivieren und mit der Erstellung von Bewirtungsbelegen zu beginnen, bestätigen Sie bitte Ihre E-Mail-Adresse, indem Sie auf die Schaltfläche unten klicken:'
)}

${generateButton('E-Mail-Adresse bestätigen', verificationUrl)}

${generateParagraph(
  `Dieser Bestätigungslink ist ${expiryHours} Stunden lang gültig.`
)}

${generateInfoBox(
  '<strong>Wichtig:</strong> Nachdem Sie Ihre E-Mail-Adresse bestätigt haben, können Sie Ihr Passwort festlegen und sich anmelden.'
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
    title: 'Willkommen bei DocBits - E-Mail bestätigen',
    preheader: 'Bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren',
    content,
  });
}

/**
 * Generate email verification reminder (for users who haven't verified yet)
 * @param props - Verification reminder properties
 * @returns HTML email string
 */
export function generateVerificationReminderEmail(props: WelcomeEmailProps): string {
  const { userName, verificationUrl, expiryHours = 24 } = props;

  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading('E-Mail-Bestätigung ausstehend')}

${generateParagraph(
  `${greeting}, wir haben bemerkt, dass Sie Ihre E-Mail-Adresse noch nicht bestätigt haben.`
)}

${generateParagraph(
  'Um Ihr DocBits-Konto nutzen zu können, bestätigen Sie bitte Ihre E-Mail-Adresse:'
)}

${generateButton('Jetzt bestätigen', verificationUrl)}

${generateParagraph(
  `Dieser Link ist noch ${expiryHours} Stunden lang gültig.`
)}

${generateParagraph(
  'Falls der Button nicht funktioniert, können Sie auch den folgenden Link kopieren und in Ihren Browser einfügen:'
)}

${generateParagraph(
  `<a href="${verificationUrl}" style="color: #228BE6; word-break: break-all;">${verificationUrl}</a>`
)}

${generateParagraph('Mit freundlichen Grüßen,<br>Ihr DocBits Team')}
  `.trim();

  return generateBaseEmail({
    title: 'E-Mail-Bestätigung ausstehend',
    preheader: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
    content,
  });
}

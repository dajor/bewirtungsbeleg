/**
 * Password reset email template
 * Sent when a user requests to reset their password
 */

import {
  generateBaseEmail,
  generateButton,
  generateHeading,
  generateParagraph,
  generateInfoBox,
  type BaseEmailProps,
} from './base';

export interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
  expiryMinutes?: number;
}

/**
 * Generate password reset email
 * @param props - Password reset email properties
 * @returns HTML email string
 */
export function generatePasswordResetEmail(props: PasswordResetEmailProps): string {
  const { userName, resetUrl, expiryMinutes = 30 } = props;

  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading('Passwort zurücksetzen')}

${generateParagraph(
  `${greeting}, wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.`
)}

${generateParagraph(
  'Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:'
)}

${generateButton('Passwort zurücksetzen', resetUrl)}

${generateParagraph(
  `Dieser Link ist ${expiryMinutes} Minuten lang gültig und kann nur einmal verwendet werden.`
)}

${generateInfoBox(
  '<strong>Sicherheitshinweis:</strong> Wenn Sie keine Passwortänderung angefordert haben, ignorieren Sie diese E-Mail bitte. Ihr aktuelles Passwort bleibt unverändert.'
)}

${generateParagraph(
  'Falls der Button nicht funktioniert, können Sie auch den folgenden Link kopieren und in Ihren Browser einfügen:'
)}

${generateParagraph(
  `<a href="${resetUrl}" style="color: #228BE6; word-break: break-all;">${resetUrl}</a>`
)}

${generateParagraph(
  'Aus Sicherheitsgründen empfehlen wir Ihnen, ein sicheres Passwort zu wählen, das mindestens 8 Zeichen enthält und eine Kombination aus Buchstaben, Zahlen und Sonderzeichen verwendet.'
)}

${generateParagraph('Mit freundlichen Grüßen,<br>Ihr DocBits Team')}
  `.trim();

  return generateBaseEmail({
    title: 'Passwort zurücksetzen - DocBits',
    preheader: 'Setzen Sie Ihr Passwort zurück, um wieder Zugriff auf Ihr Konto zu erhalten',
    content,
  });
}

/**
 * Generate password changed confirmation email
 * @param userName - User's name (optional)
 * @returns HTML email string
 */
export function generatePasswordChangedEmail(userName?: string): string {
  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading('Passwort erfolgreich geändert')}

${generateParagraph(
  `${greeting}, Ihr Passwort wurde erfolgreich geändert.`
)}

${generateParagraph(
  'Sie können sich jetzt mit Ihrem neuen Passwort bei DocBits anmelden.'
)}

${generateInfoBox(
  '<strong>Wichtig:</strong> Wenn Sie diese Änderung nicht vorgenommen haben, wenden Sie sich bitte umgehend an unseren Support unter <a href="mailto:support@docbits.com" style="color: #228BE6;">support@docbits.com</a>'
)}

${generateParagraph(
  'Diese E-Mail dient lediglich zu Ihrer Information. Es sind keine weiteren Schritte erforderlich.'
)}

${generateParagraph('Mit freundlichen Grüßen,<br>Ihr DocBits Team')}
  `.trim();

  return generateBaseEmail({
    title: 'Passwort geändert - DocBits',
    preheader: 'Ihr Passwort wurde erfolgreich geändert',
    content,
  });
}

/**
 * Magic link email template
 * Sent when a user requests passwordless authentication
 */

import {
  generateBaseEmail,
  generateButton,
  generateHeading,
  generateParagraph,
  generateInfoBox,
  type BaseEmailProps,
} from './base';

export interface MagicLinkEmailProps {
  userName?: string;
  magicLinkUrl: string;
  expiryMinutes?: number;
}

/**
 * Generate magic link email for passwordless authentication
 * @param props - Magic link email properties
 * @returns HTML email string
 */
export function generateMagicLinkEmail(props: MagicLinkEmailProps): string {
  const { userName, magicLinkUrl, expiryMinutes = 10 } = props;

  const greeting = userName ? `Hallo ${userName}` : 'Hallo';

  const content = `
${generateHeading('Ihr Anmelde-Link')}

${generateParagraph(
  `${greeting}, hier ist Ihr persönlicher Anmelde-Link für DocBits.`
)}

${generateParagraph(
  'Klicken Sie auf die Schaltfläche unten, um sich anzumelden:'
)}

${generateButton('Jetzt anmelden', magicLinkUrl)}

${generateParagraph(
  `Dieser Link ist ${expiryMinutes} Minuten lang gültig und kann nur einmal verwendet werden.`
)}

${generateInfoBox(
  '<strong>Sicherheitshinweis:</strong> Dieser Link ermöglicht den direkten Zugriff auf Ihr Konto. Teilen Sie ihn nicht mit anderen Personen.'
)}

${generateParagraph(
  'Falls der Button nicht funktioniert, können Sie auch den folgenden Link kopieren und in Ihren Browser einfügen:'
)}

${generateParagraph(
  `<a href="${magicLinkUrl}" style="color: #228BE6; word-break: break-all;">${magicLinkUrl}</a>`
)}

${generateParagraph(
  'Wenn Sie sich nicht bei DocBits anmelden wollten, können Sie diese E-Mail einfach ignorieren. Der Link wird automatisch ungültig.'
)}

${generateParagraph('Mit freundlichen Grüßen,<br>Ihr DocBits Team')}
  `.trim();

  return generateBaseEmail({
    title: 'Ihr Anmelde-Link - DocBits',
    preheader: 'Klicken Sie auf den Link, um sich bei DocBits anzumelden',
    content,
  });
}

/**
 * Base email template with DocBits branding
 * Provides consistent header, footer, and styling for all emails
 */

export interface BaseEmailProps {
  title: string;
  preheader?: string;
  content: string;
}

// Primary brand color from Mantine theme
const PRIMARY_COLOR = '#228BE6';
const TEXT_COLOR = '#212529';
const SECONDARY_TEXT_COLOR = '#868E96';
const BORDER_COLOR = '#E9ECEF';
const BACKGROUND_COLOR = '#F8F9FA';

/**
 * Generate base email HTML with DocBits branding
 * @param props - Email properties (title, preheader, content)
 * @returns HTML string
 */
export function generateBaseEmail(props: BaseEmailProps): string {
  const { title, preheader = '', content } = props;

  return `
<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body {
      margin: 0;
      padding: 0;
      min-width: 100%;
      width: 100% !important;
      height: 100% !important;
    }
    body, table, td, div, p, a {
      -webkit-font-smoothing: antialiased;
      text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      line-height: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse !important;
      border-spacing: 0;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    /* Typography */
    body, table, td, a {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Responsive */
    @media only screen and (max-width: 640px) {
      .wrapper {
        width: 100% !important;
        padding: 0 !important;
      }
      .container {
        width: 100% !important;
        padding: 20px !important;
      }
      .mobile-padding {
        padding-left: 15px !important;
        padding-right: 15px !important;
      }
      .mobile-button {
        width: 100% !important;
        display: block !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: ${BACKGROUND_COLOR};">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}

  <!-- Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BACKGROUND_COLOR};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="wrapper" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px;" class="mobile-padding">
              <!-- DocBits Logo as HTML Text (Gmail-compatible) -->
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 36px; font-weight: 700; color: ${PRIMARY_COLOR}; letter-spacing: -0.5px; line-height: 1;">
                DocBits
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 500; color: ${SECONDARY_TEXT_COLOR}; margin-top: 5px; letter-spacing: 1px;">
                BEWIRTUNGSBELEG
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid ${BORDER_COLOR}; background-color: ${BACKGROUND_COLOR};" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <p style="margin: 0; font-size: 14px; line-height: 20px; color: ${TEXT_COLOR}; font-weight: 600;">
                      FELLOWPRO AG
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 14px; line-height: 20px; color: ${SECONDARY_TEXT_COLOR};">
                      DocBits Software
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: ${SECONDARY_TEXT_COLOR};">
                      Diese E-Mail wurde an Sie gesendet, weil Sie ein Konto bei DocBits haben.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <a href="https://bewirtungsbeleg.docbits.com/privacy" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-size: 12px; line-height: 18px; margin: 0 10px;">
                            Datenschutz
                          </a>
                        </td>
                        <td style="color: ${SECONDARY_TEXT_COLOR};">|</td>
                        <td>
                          <a href="https://bewirtungsbeleg.docbits.com/terms" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-size: 12px; line-height: 18px; margin: 0 10px;">
                            AGB
                          </a>
                        </td>
                        <td style="color: ${SECONDARY_TEXT_COLOR};">|</td>
                        <td>
                          <a href="mailto:support@docbits.com" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-size: 12px; line-height: 18px; margin: 0 10px;">
                            Support
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>
  <!-- End Wrapper -->

</body>
</html>
  `.trim();
}

/**
 * Generate button HTML for email templates
 * @param text - Button text
 * @param url - Button URL
 * @returns HTML string
 */
export function generateButton(text: string, url: string): string {
  return `
<table border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
  <tr>
    <td align="center" style="border-radius: 6px; background-color: ${PRIMARY_COLOR};" class="mobile-button">
      <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; min-width: 200px; text-align: center;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * Generate heading HTML for email templates
 * @param text - Heading text
 * @param level - Heading level (1 or 2)
 * @returns HTML string
 */
export function generateHeading(text: string, level: 1 | 2 = 1): string {
  const fontSize = level === 1 ? '28px' : '22px';
  const lineHeight = level === 1 ? '36px' : '30px';
  const marginBottom = level === 1 ? '20px' : '15px';

  return `
<h${level} style="margin: 0 0 ${marginBottom} 0; font-size: ${fontSize}; line-height: ${lineHeight}; color: ${TEXT_COLOR}; font-weight: 600;">
  ${text}
</h${level}>
  `.trim();
}

/**
 * Generate paragraph HTML for email templates
 * @param text - Paragraph text
 * @returns HTML string
 */
export function generateParagraph(text: string): string {
  return `
<p style="margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: ${TEXT_COLOR};">
  ${text}
</p>
  `.trim();
}

/**
 * Generate divider HTML for email templates
 * @returns HTML string
 */
export function generateDivider(): string {
  return `
<div style="margin: 30px 0; border-top: 1px solid ${BORDER_COLOR};"></div>
  `.trim();
}

/**
 * Generate info box HTML for email templates
 * @param text - Info text
 * @returns HTML string
 */
export function generateInfoBox(text: string): string {
  return `
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
  <tr>
    <td style="padding: 15px; background-color: ${BACKGROUND_COLOR}; border-radius: 6px; border-left: 3px solid ${PRIMARY_COLOR};">
      <p style="margin: 0; font-size: 14px; line-height: 20px; color: ${TEXT_COLOR};">
        ${text}
      </p>
    </td>
  </tr>
</table>
  `.trim();
}

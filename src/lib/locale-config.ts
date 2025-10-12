/**
 * Locale Configuration for International Receipt Processing
 *
 * Defines locale-specific formatting rules for:
 * - Number formatting (decimal/thousand separators)
 * - Date formatting
 * - Special characters
 * - Currency symbols
 */

export interface LocaleConfig {
  code: string;                 // ISO locale code (e.g., 'de-DE', 'de-CH')
  language: string;             // Language code (e.g., 'de', 'it', 'fr')
  region: string;               // Region code (e.g., 'DE', 'CH', 'IT')
  name: string;                 // Display name (e.g., 'German (Germany)')

  // Number formatting
  numberFormat: {
    decimalSeparator: string;   // e.g., ',' or '.'
    thousandSeparator: string;  // e.g., '.', ',', ' ', or '''
    example: string;            // e.g., '1.234,56' or '1'234.56'
  };

  // Date formatting
  dateFormat: {
    shortFormat: string;        // e.g., 'DD.MM.YYYY' or 'MM/DD/YYYY'
    longFormat: string;         // e.g., 'DD. MMMM YYYY'
  };

  // Common special characters in this locale
  specialChars: string[];

  // Currency
  defaultCurrency: string;
  currencySymbol: string;

  // Common receipt terms (for better OCR recognition)
  receiptTerms: {
    total: string[];            // e.g., ['Gesamt', 'Total', 'Summe']
    vat: string[];              // e.g., ['MwSt.', 'USt.', 'TVA', 'IVA']
    net: string[];              // e.g., ['Netto', 'Net', 'Neto']
    date: string[];             // e.g., ['Datum', 'Date', 'Data']
  };
}

export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  'de-DE': {
    code: 'de-DE',
    language: 'de',
    region: 'DE',
    name: 'German (Germany)',
    numberFormat: {
      decimalSeparator: ',',
      thousandSeparator: '.',
      example: '1.234,56'
    },
    dateFormat: {
      shortFormat: 'DD.MM.YYYY',
      longFormat: 'DD. MMMM YYYY'
    },
    specialChars: ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'],
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    receiptTerms: {
      total: ['Gesamt', 'Gesamtbetrag', 'Summe', 'Total', 'Brutto'],
      vat: ['MwSt.', 'MwSt', 'USt.', 'USt', 'Mehrwertsteuer'],
      net: ['Netto', 'Nettobetrag'],
      date: ['Datum', 'Date']
    }
  },

  'de-CH': {
    code: 'de-CH',
    language: 'de',
    region: 'CH',
    name: 'German (Switzerland)',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: "'",  // Swiss uses apostrophe
      example: "1'234.56"
    },
    dateFormat: {
      shortFormat: 'DD.MM.YYYY',
      longFormat: 'DD. MMMM YYYY'
    },
    specialChars: ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü'],  // Note: No ß in Swiss German
    defaultCurrency: 'CHF',
    currencySymbol: 'CHF',
    receiptTerms: {
      total: ['Total', 'Gesamt', 'Summe', 'Betrag'],
      vat: ['MwSt.', 'MwSt', 'MWST'],
      net: ['Netto', 'Nettobetrag'],
      date: ['Datum', 'Date']
    }
  },

  'it-IT': {
    code: 'it-IT',
    language: 'it',
    region: 'IT',
    name: 'Italian (Italy)',
    numberFormat: {
      decimalSeparator: ',',
      thousandSeparator: '.',
      example: '1.234,56'
    },
    dateFormat: {
      shortFormat: 'DD/MM/YYYY',
      longFormat: 'DD MMMM YYYY'
    },
    specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù', 'À', 'È', 'É', 'Ì', 'Ò', 'Ù'],
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    receiptTerms: {
      total: ['Totale', 'Totale Complessivo', 'Importo Totale'],
      vat: ['IVA', 'Imposta'],
      net: ['Netto', 'Imponibile'],
      date: ['Data', 'Data Emissione']
    }
  },

  'it-CH': {
    code: 'it-CH',
    language: 'it',
    region: 'CH',
    name: 'Italian (Switzerland)',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: "'",
      example: "1'234.56"
    },
    dateFormat: {
      shortFormat: 'DD.MM.YYYY',
      longFormat: 'DD MMMM YYYY'
    },
    specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù', 'À', 'È', 'É', 'Ì', 'Ò', 'Ù'],
    defaultCurrency: 'CHF',
    currencySymbol: 'CHF',
    receiptTerms: {
      total: ['Totale', 'Total', 'Somma'],
      vat: ['IVA', 'MWST'],
      net: ['Netto', 'Imponibile'],
      date: ['Data', 'Datum']
    }
  },

  'fr-FR': {
    code: 'fr-FR',
    language: 'fr',
    region: 'FR',
    name: 'French (France)',
    numberFormat: {
      decimalSeparator: ',',
      thousandSeparator: ' ',  // French uses space
      example: '1 234,56'
    },
    dateFormat: {
      shortFormat: 'DD/MM/YYYY',
      longFormat: 'DD MMMM YYYY'
    },
    specialChars: ['à', 'â', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç', 'œ', 'æ'],
    defaultCurrency: 'EUR',
    currencySymbol: '€',
    receiptTerms: {
      total: ['Total', 'Montant Total', 'Somme'],
      vat: ['TVA', 'Taxe'],
      net: ['Net', 'Montant Net', 'HT'],
      date: ['Date', 'Date Émission']
    }
  },

  'fr-CH': {
    code: 'fr-CH',
    language: 'fr',
    region: 'CH',
    name: 'French (Switzerland)',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: "'",
      example: "1'234.56"
    },
    dateFormat: {
      shortFormat: 'DD.MM.YYYY',
      longFormat: 'DD MMMM YYYY'
    },
    specialChars: ['à', 'â', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'ç', 'œ', 'æ'],
    defaultCurrency: 'CHF',
    currencySymbol: 'CHF',
    receiptTerms: {
      total: ['Total', 'Montant Total', 'Somme'],
      vat: ['TVA', 'MWST'],
      net: ['Net', 'Montant Net'],
      date: ['Date', 'Datum']
    }
  },

  'en-US': {
    code: 'en-US',
    language: 'en',
    region: 'US',
    name: 'English (United States)',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: ',',
      example: '1,234.56'
    },
    dateFormat: {
      shortFormat: 'MM/DD/YYYY',
      longFormat: 'MMMM DD, YYYY'
    },
    specialChars: [],  // No special diacritics in English
    defaultCurrency: 'USD',
    currencySymbol: '$',
    receiptTerms: {
      total: ['Total', 'Grand Total', 'Amount Due'],
      vat: ['Tax', 'Sales Tax', 'VAT'],
      net: ['Subtotal', 'Net Amount'],
      date: ['Date', 'Date Issued']
    }
  },

  'en-GB': {
    code: 'en-GB',
    language: 'en',
    region: 'GB',
    name: 'English (United Kingdom)',
    numberFormat: {
      decimalSeparator: '.',
      thousandSeparator: ',',
      example: '1,234.56'
    },
    dateFormat: {
      shortFormat: 'DD/MM/YYYY',
      longFormat: 'DD MMMM YYYY'
    },
    specialChars: [],
    defaultCurrency: 'GBP',
    currencySymbol: '£',
    receiptTerms: {
      total: ['Total', 'Grand Total', 'Amount Payable'],
      vat: ['VAT', 'Tax'],
      net: ['Net', 'Subtotal'],
      date: ['Date', 'Invoice Date']
    }
  }
};

/**
 * Get locale configuration by code
 * Falls back to de-DE if not found
 */
export function getLocaleConfig(localeCode: string): LocaleConfig {
  return LOCALE_CONFIGS[localeCode] || LOCALE_CONFIGS['de-DE'];
}

/**
 * Detect locale from language and region codes
 * Falls back to de-DE if specific combination not found
 */
export function detectLocale(language: string, region: string): LocaleConfig {
  const localeCode = `${language}-${region}`;

  // Try exact match first
  if (LOCALE_CONFIGS[localeCode]) {
    return LOCALE_CONFIGS[localeCode];
  }

  // Try finding by language only
  const languageMatch = Object.values(LOCALE_CONFIGS).find(
    config => config.language === language
  );

  if (languageMatch) {
    return languageMatch;
  }

  // Fallback to German (Germany)
  return LOCALE_CONFIGS['de-DE'];
}

/**
 * Convert number from locale format to standard format
 */
export function parseLocalizedNumber(value: string, locale: LocaleConfig): number {
  if (!value) return 0;

  // Remove thousand separators and replace decimal separator with period
  const cleaned = value
    .replace(new RegExp(`\\${locale.numberFormat.thousandSeparator}`, 'g'), '')
    .replace(locale.numberFormat.decimalSeparator, '.');

  return parseFloat(cleaned);
}

/**
 * Convert number to locale format
 */
export function formatLocalizedNumber(value: number, locale: LocaleConfig): string {
  const parts = value.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousand separators
  let formattedInteger = '';
  for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedInteger = locale.numberFormat.thousandSeparator + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
  }

  return `${formattedInteger}${locale.numberFormat.decimalSeparator}${decimalPart}`;
}

/**
 * Get list of all supported locale codes
 */
export function getSupportedLocales(): string[] {
  return Object.keys(LOCALE_CONFIGS);
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(localeCode: string): string {
  const config = getLocaleConfig(localeCode);
  return config.name;
}

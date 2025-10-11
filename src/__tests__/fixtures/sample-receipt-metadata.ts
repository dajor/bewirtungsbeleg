/**
 * Sample receipt metadata for testing
 */

export const sampleReceiptMetadata = {
  datum: '15.03.2024',
  restaurantName: 'Zum Goldenen Löwen',
  restaurantAnschrift: 'Hauptstraße 123, 10115 Berlin',
  teilnehmer: 'Max Mustermann, Erika Beispiel, Hans Schmidt',
  anlass: 'Kundengespräch und Vertragsverhandlung',
  gesamtbetrag: '156.50',
  gesamtbetragMwst: '25.04',
  gesamtbetragNetto: '131.46',
  trinkgeld: '10.00',
  zahlungsart: 'Kreditkarte',
  bemerkungen: 'Geschäftsessen mit wichtigen Kunden',
  mitarbeiterName: 'Max Mustermann',
  mitarbeiterPersonalnummer: 'EMP-001',
  istEigenbeleg: false,
  fileName: 'Bewirtungsbeleg_Goldenen_Loewen_15.03.2024.pdf',
  type: 'bewirtungsbeleg',
  currency: 'EUR',
};

export const sampleEigenbelegMetadata = {
  datum: '20.03.2024',
  restaurantName: 'Café am Markt',
  restaurantAnschrift: 'Marktplatz 5, 80331 München',
  teilnehmer: 'Erika Beispiel',
  anlass: 'Kundenmeeting',
  gesamtbetrag: '45.80',
  gesamtbetragMwst: '7.33',
  gesamtbetragNetto: '38.47',
  trinkgeld: '5.00',
  zahlungsart: 'Bar',
  bemerkungen: 'Kein Beleg verfügbar',
  mitarbeiterName: 'Erika Beispiel',
  mitarbeiterPersonalnummer: 'EMP-002',
  istEigenbeleg: true,
  fileName: 'Eigenbeleg_Cafe_am_Markt_20.03.2024.pdf',
  type: 'eigenbeleg',
  currency: 'EUR',
};

export const minimalReceiptMetadata = {
  datum: '01.04.2024',
  restaurantName: 'Test Restaurant',
  gesamtbetrag: '50.00',
  zahlungsart: 'Bar',
  istEigenbeleg: false,
};

export const invalidReceiptMetadata = {
  // Missing required fields for validation tests
  restaurantName: 'Invalid Restaurant',
};

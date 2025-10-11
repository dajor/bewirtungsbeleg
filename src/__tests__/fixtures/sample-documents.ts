/**
 * Sample OpenSearch documents for testing
 */

import type { Document } from '@/types/document';
import { sampleEmbedding1, sampleEmbedding2 } from './sample-embeddings';

export const sampleDocument1: Document = {
  id: 'doc-user-1-1710518400000',
  name: 'Bewirtungsbeleg_Goldenen_Loewen_15.03.2024.pdf',
  type: 'bewirtungsbeleg',
  status: 'completed',
  created_at: '2024-03-15T12:00:00.000Z',
  updated_at: '2024-03-15T12:00:00.000Z',
  thumbnail_url: 'https://example.com/thumbnails/doc-1.png',
  pdf_url: 'https://example.com/pdfs/doc-1.pdf',
  original_url: 'https://example.com/pdfs/doc-1.pdf',
  user_id: 'user-1',
  metadata: {
    total_amount: 156.5,
    currency: 'EUR',
    date: '15.03.2024',
    restaurant_name: 'Zum Goldenen Löwen',
    participants: ['Max Mustermann', 'Erika Beispiel', 'Hans Schmidt'],
    business_purpose: 'Kundengespräch und Vertragsverhandlung',
    restaurant_address: 'Hauptstraße 123, 10115 Berlin',
    payment_method: 'Kreditkarte',
    notes: 'Geschäftsessen mit wichtigen Kunden',
    employee_name: 'Max Mustermann',
    employee_number: 'EMP-001',
    vat_amount: 25.04,
    net_amount: 131.46,
    tip: 10.0,
    is_eigenbeleg: false,
  },
  gobd_compliant: true,
  signature_hash: 'sha256-abc123def456',
};

export const sampleDocument2: Document = {
  id: 'doc-user-1-1710950400000',
  name: 'Eigenbeleg_Cafe_am_Markt_20.03.2024.pdf',
  type: 'eigenbeleg',
  status: 'completed',
  created_at: '2024-03-20T10:00:00.000Z',
  updated_at: '2024-03-20T10:00:00.000Z',
  thumbnail_url: 'https://example.com/thumbnails/doc-2.png',
  pdf_url: 'https://example.com/pdfs/doc-2.pdf',
  original_url: 'https://example.com/pdfs/doc-2.pdf',
  user_id: 'user-1',
  metadata: {
    total_amount: 45.8,
    currency: 'EUR',
    date: '20.03.2024',
    restaurant_name: 'Café am Markt',
    participants: ['Erika Beispiel'],
    business_purpose: 'Kundenmeeting',
    restaurant_address: 'Marktplatz 5, 80331 München',
    payment_method: 'Bar',
    notes: 'Kein Beleg verfügbar',
    employee_name: 'Erika Beispiel',
    employee_number: 'EMP-002',
    vat_amount: 7.33,
    net_amount: 38.47,
    tip: 5.0,
    is_eigenbeleg: true,
  },
  gobd_compliant: true,
  signature_hash: 'sha256-xyz789ghi012',
};

// Sample OpenSearch document with embedding
export const sampleOpenSearchDocument = {
  ...sampleDocument1,
  embedding: sampleEmbedding1,
  full_text: `Dokumenttyp: bewirtungsbeleg
Datum: 15.03.2024
Restaurant: Zum Goldenen Löwen
Adresse: Hauptstraße 123, 10115 Berlin
Teilnehmer: Max Mustermann, Erika Beispiel, Hans Schmidt
Anlass: Kundengespräch und Vertragsverhandlung
Gesamtbetrag: 156.50 EUR
Mehrwertsteuer: 25.04 EUR
Nettobetrag: 131.46 EUR
Trinkgeld: 10.00 EUR
Zahlungsart: Kreditkarte
Bemerkungen: Geschäftsessen mit wichtigen Kunden
Mitarbeiter: Max Mustermann`,
  form_data: {
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
  },
};

export const sampleDocumentList = [sampleDocument1, sampleDocument2];

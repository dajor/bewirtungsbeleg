import { NextRequest } from 'next/server';
import { ReadableStream } from 'stream/web';

export function createMockNextRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  url?: string;
} = {}): NextRequest {
  const { 
    method = 'GET', 
    headers = {}, 
    body = null,
    url = 'http://localhost:3000'
  } = options;

  const init: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    if (typeof body === 'string') {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers = new Headers({
        ...headers,
        'Content-Type': 'application/json',
      });
    }
  }

  return new NextRequest(url, init);
}

export function createMockFormData(fields: Record<string, string | File>): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}

export function createMockFile(
  content: string,
  filename: string,
  mimeType: string = 'image/jpeg'
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

export const mockReceiptData = {
  valid: {
    shopName: 'Test Restaurant GmbH',
    shopAddress: 'Hauptstraße 123, 10115 Berlin',
    date: '2024-01-15',
    time: '14:30',
    items: [
      { description: 'Schnitzel mit Pommes', quantity: 2, price: 25.90 },
      { description: 'Cola 0,3l', quantity: 2, price: 4.50 }
    ],
    tax: {
      rate: 19,
      amount: 5.77
    },
    total: 35.67
  },
  invalid: {
    shopName: '',
    items: [],
    total: 0
  }
};

export const mockBewirtungData = {
  kundenbewirtung: {
    Art: 'Kundenbewirtung',
    Anlass: 'Geschäftsessen mit Kunde ABC GmbH',
    Ort: 'Restaurant Zur Post, Berlin',
    Datum: '15.01.2024',
    Kosten: '89.50',
    BewirtetePersonen: [
      { Name: 'Max Mustermann', Firma: 'ABC GmbH' },
      { Name: 'Erika Musterfrau', Firma: 'ABC GmbH' }
    ],
    TeilnehmendeMitarbeiter: [
      { Name: 'John Doe', Abteilung: 'Vertrieb' }
    ]
  },
  mitarbeiterbewirtung: {
    Art: 'Mitarbeiterbewirtung',
    Anlass: 'Team Meeting Q1 2024',
    Ort: 'Konferenzraum A, Firmenzentrale',
    Datum: '15.01.2024', 
    Kosten: '45.80',
    BewirtetePersonen: [],
    TeilnehmendeMitarbeiter: [
      { Name: 'John Doe', Abteilung: 'IT' },
      { Name: 'Jane Smith', Abteilung: 'Marketing' },
      { Name: 'Bob Johnson', Abteilung: 'Vertrieb' }
    ]
  }
};
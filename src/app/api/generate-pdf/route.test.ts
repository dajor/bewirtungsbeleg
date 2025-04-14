import { test, expect } from '@jest/globals';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import nodeFetch from 'node-fetch';
import { Headers } from 'node-fetch';
import path from 'path';

const testData = {
  datum: '2024-01-01',
  restaurantName: 'Test Restaurant',
  restaurantAnschrift: 'Test Anschrift',
  teilnehmer: 'Test Teilnehmer',
  anlass: 'Test Anlass',
  gesamtbetrag: '100',
  gesamtbetragMwst: '19',
  gesamtbetragNetto: '81',
  kreditkartenBetrag: '50',
  trinkgeld: '10',
  trinkgeldMwst: '1.9',
  zahlungsart: 'firma',
  bewirtungsart: 'kunden',
  geschaeftspartnerNamen: 'Test Geschaeftspartner',
  geschaeftspartnerFirma: 'Test Firma',
  istAuslaendischeRechnung: false,
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
};

const fetch = (url: any, options: any) => nodeFetch(url, { ...options, headers: new Headers(options.headers) });


test('should use kundenbewirtung.pdf for kunden bewirtungsart', async () => {  
  console.log("Test started: should use kundenbewirtung.pdf for kunden bewirtungsart");

  const response = await fetch('http://localhost:3000/api/generate-pdf' as any, {
    method: 'POST',
     headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData),
  });

  expect(response.ok).toBeTruthy();
  const pdfBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const firstPageContent = await pdfDoc.getForm().getTextField('test').getText();

  expect(firstPageContent).toEqual('test kundenbewirtung');
});

test('should use mitarbeiterbewirtung.pdf for mitarbeiter bewirtungsart', async () => {  
  console.log("Test started: should use mitarbeiterbewirtung.pdf for mitarbeiter bewirtungsart");


    const mitarbeiterTestData = { ...testData, bewirtungsart: 'mitarbeiter' };
    const response = await fetch('http://localhost:3000/api/generate-pdf' as any, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mitarbeiterTestData),
    });
  
    expect(response.ok).toBeTruthy();
    const pdfBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const firstPageContent = await pdfDoc.getForm().getTextField('test').getText();
  
    expect(firstPageContent).toEqual('test mitarbeiterbewirtung');
  });

  test('should add an image as a new page', async () => {  
    console.log("Test started: should add an image as a new page");
  }, 10000);

test('should add an image as a new page', async () => {
    const response = await fetch('http://localhost:3000/api/generate-pdf' as any, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testData) });
    expect(response.ok).toBeTruthy();
    const pdfBuffer = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    expect(pdfDoc.getPages().length).toBe(2);
  });
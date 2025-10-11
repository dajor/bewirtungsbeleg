import { test, expect } from '@playwright/test';

test('Analyze bewirtungsbeleg website for UX improvements', async ({ page }) => {
  // Navigate to the website
  await page.goto('https://dev.bewirtungsbeleg.docbits.com/');

  // Take screenshot of landing page
  await page.screenshot({ path: 'screenshots/landing-page.png', fullPage: true });

  // Analyze page structure
  const title = await page.title();
  console.log('Page Title:', title);

  // Get all headings
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
  console.log('Headings:', headings);

  // Get all buttons
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons:', buttons);

  // Get all links
  const links = await page.locator('a').evaluateAll(elements =>
    elements.map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') }))
  );
  console.log('Links:', links);

  // Check for forms
  const forms = await page.locator('form').count();
  console.log('Number of forms:', forms);

  // Get form labels
  const labels = await page.locator('label').allTextContents();
  console.log('Form labels:', labels);

  // Get input placeholders
  const inputs = await page.locator('input').evaluateAll(elements =>
    elements.map(el => ({
      type: el.getAttribute('type'),
      placeholder: el.getAttribute('placeholder'),
      label: el.getAttribute('aria-label')
    }))
  );
  console.log('Input fields:', inputs);

  // Check for any help text or descriptions
  const helpTexts = await page.locator('[class*="help"], [class*="description"], [class*="hint"], p').allTextContents();
  console.log('Help texts:', helpTexts.slice(0, 10)); // First 10 to avoid too much output

  // Get page HTML structure
  const bodyHTML = await page.locator('body').innerHTML();

  // Save HTML for analysis
  const fs = require('fs');
  fs.writeFileSync('screenshots/page-structure.html', bodyHTML);

  console.log('\n=== UX ANALYSIS COMPLETE ===');
  console.log('Screenshots and HTML saved to screenshots/ directory');
});

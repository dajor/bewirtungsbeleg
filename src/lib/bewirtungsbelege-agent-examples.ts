/**
 * Example usage and test cases for the Bewirtungsbelege Agent
 */

import { 
  BewirtungsbelegAgent, 
  BewirtungsbelegData,
  Participant 
} from './bewirtungsbelege-agent';

// Initialize the agent
const agent = new BewirtungsbelegAgent();

/**
 * Example 1: Customer Entertainment (Geschäftliche Bewirtung)
 * Restaurant dinner with clients requiring 70/30 split
 */
export const customerEntertainmentExample = (): void => {
  const receiptData: BewirtungsbelegData = {
    vendor: 'Restaurant Zur Post',
    date: '15.03.2024',
    totalAmount: 342.50,
    businessPurpose: 'Vertragsverhandlung Projekt Phoenix mit Kunde',
    location: 'München',
    receiptNumber: 'RE-2024-0342',
    participants: [
      { name: 'Max Müller', company: 'ABC GmbH', role: 'customer', isExternal: true },
      { name: 'Lisa Schmidt', company: 'ABC GmbH', role: 'customer', isExternal: true },
      { name: 'Thomas Weber', company: 'Eigene Firma', role: 'employee', isExternal: false },
      { name: 'Sarah Meyer', company: 'Eigene Firma', role: 'employee', isExternal: false }
    ],
    lineItems: [
      { description: '4x Hauptgang', amount: 180.00, category: 'meal', vatRate: 7 },
      { description: '4x Vorspeise', amount: 60.00, category: 'meal', vatRate: 7 },
      { description: 'Wein & Getränke', amount: 85.00, category: 'beverage', vatRate: 19 },
      { description: 'Trinkgeld', amount: 17.50, category: 'tip', vatRate: 0 }
    ]
  };

  console.log('=== CUSTOMER ENTERTAINMENT EXAMPLE ===\n');

  // Analyze participants
  const participantAnalysis = agent.analyzeParticipants(receiptData.participants);
  console.log('Participant Analysis:', participantAnalysis);

  // Calculate tax split
  const taxCalculation = agent.calculateTaxSplit(receiptData);
  console.log('\nTax Calculation:');
  console.log(`- Meals: ${taxCalculation.meals.gross.toFixed(2)}€ (70% = ${taxCalculation.meals.deductible70.toFixed(2)}€)`);
  console.log(`- Beverages: ${taxCalculation.beverages.gross.toFixed(2)}€ (70% = ${taxCalculation.beverages.deductible70.toFixed(2)}€)`);
  console.log(`- Tips: ${taxCalculation.tips.amount.toFixed(2)}€ (70% = ${taxCalculation.tips.deductible70.toFixed(2)}€)`);
  console.log(`- Total Deductible: ${taxCalculation.totals.totalDeductible.toFixed(2)}€`);
  console.log(`- Total Non-Deductible: ${taxCalculation.totals.totalNonDeductible.toFixed(2)}€`);

  // Generate booking entries
  const bookingEntries = agent.generateBookingEntries(receiptData, 'SKR03');
  console.log('\nBooking Entries (SKR03):');
  bookingEntries.entries.forEach(entry => {
    console.log(`- ${entry.account}: ${entry.description} = ${entry.amount.toFixed(2)}€`);
    if (entry.vatAmount) {
      console.log(`  VAT (${entry.vatRate}%): ${entry.vatAmount.toFixed(2)}€`);
    }
  });

  // Validate compliance
  const compliance = agent.validateCompliance(receiptData);
  console.log('\nCompliance Check:', compliance.isValid ? '✅ Valid' : '❌ Invalid');
  if (compliance.errors.length > 0) {
    console.log('Errors:', compliance.errors);
  }
  if (compliance.warnings.length > 0) {
    console.log('Warnings:', compliance.warnings);
  }

  // Get recommendations
  const recommendations = agent.getRecommendations(receiptData);
  console.log('\nRecommendations:');
  recommendations.forEach(rec => console.log(`- ${rec}`));
};

/**
 * Example 2: Employee Entertainment (Betriebliche Bewirtung)
 * Team dinner with only internal participants
 */
export const employeeEntertainmentExample = (): void => {
  const receiptData: BewirtungsbelegData = {
    vendor: 'Gasthof Adler',
    date: '20.03.2024',
    totalAmount: 245.00,
    businessPurpose: 'Quartalsbesprechung Vertriebsteam',
    location: 'Frankfurt',
    receiptNumber: 'GA-2024-1823',
    participants: [
      { name: 'Klaus Wagner', company: 'Eigene Firma', role: 'employee', isExternal: false },
      { name: 'Anna Becker', company: 'Eigene Firma', role: 'employee', isExternal: false },
      { name: 'Peter Schulz', company: 'Eigene Firma', role: 'employee', isExternal: false },
      { name: 'Julia Fischer', company: 'Eigene Firma', role: 'employee', isExternal: false },
      { name: 'Michael Hoffmann', company: 'Eigene Firma', role: 'employee', isExternal: false }
    ],
    lineItems: [
      { description: '5x Hauptspeise', amount: 150.00, category: 'meal', vatRate: 7 },
      { description: 'Getränke', amount: 75.00, category: 'beverage', vatRate: 19 },
      { description: 'Trinkgeld', amount: 20.00, category: 'tip', vatRate: 0 }
    ]
  };

  console.log('\n=== EMPLOYEE ENTERTAINMENT EXAMPLE ===\n');

  const participantAnalysis = agent.analyzeParticipants(receiptData.participants);
  console.log('Type:', participantAnalysis.description);

  const taxCalculation = agent.calculateTaxSplit(receiptData);
  console.log('\nNo 70/30 split needed - 100% potentially deductible');
  console.log(`Total Amount: ${taxCalculation.totals.gross.toFixed(2)}€`);
  console.log(`Total Deductible: ${taxCalculation.totals.totalDeductible.toFixed(2)}€`);

  const bookingEntries = agent.generateBookingEntries(receiptData, 'SKR03');
  console.log('\nSimplified Booking (only 3 entries):');
  bookingEntries.entries.forEach(entry => {
    console.log(`- ${entry.account}: ${entry.description} = ${entry.amount.toFixed(2)}€`);
  });
};

/**
 * Example 3: Excessive Amount Warning
 * High per-person amount triggering warnings
 */
export const excessiveAmountExample = (): void => {
  const receiptData: BewirtungsbelegData = {
    vendor: 'Sternerestaurant Gourmet',
    date: '01.04.2024',
    totalAmount: 850.00,
    businessPurpose: 'Geschäftsessen',
    location: 'Hamburg',
    receiptNumber: 'SG-2024-0012',
    participants: [
      { name: 'VIP Kunde', company: 'Big Corp', role: 'customer', isExternal: true },
      { name: 'Geschäftsführer', company: 'Eigene Firma', role: 'employee', isExternal: false }
    ],
    lineItems: [
      { description: 'Degustationsmenü', amount: 600.00, category: 'meal', vatRate: 7 },
      { description: 'Weinbegleitung', amount: 200.00, category: 'beverage', vatRate: 19 },
      { description: 'Trinkgeld', amount: 50.00, category: 'tip', vatRate: 0 }
    ]
  };

  console.log('\n=== EXCESSIVE AMOUNT EXAMPLE ===\n');

  const compliance = agent.validateCompliance(receiptData);
  console.log('Compliance Status:', compliance.isValid ? '✅' : '❌');
  console.log('Per Person Amount: €425.00');
  console.log('\nWarnings and Errors:');
  [...compliance.errors, ...compliance.warnings].forEach(msg => console.log(`⚠️ ${msg}`));

  const recommendations = agent.getRecommendations(receiptData);
  console.log('\nSpecial Recommendations:');
  recommendations.forEach(rec => console.log(rec));
};

/**
 * Example 4: OCR Text Parsing
 * Parse unstructured receipt text
 */
export const ocrParsingExample = (): void => {
  const rawReceiptText = `
    Restaurant Milano
    Hauptstr. 42, 10115 Berlin
    
    Datum: 25.03.2024
    Rechnung Nr: 2024-0892
    
    2x Pizza Margherita     34,00 €
    1x Pasta Carbonara      18,50 €
    1x Salat Caesar         12,00 €
    MwSt 7%                  4,52 €
    
    4x Bier 0,3l           16,00 €
    2x Wein rot            24,00 €
    1x Wasser              3,50 €
    MwSt 19%                8,27 €
    
    Zwischensumme         120,79 €
    Trinkgeld              12,00 €
    
    GESAMT                132,79 €
    
    Vielen Dank für Ihren Besuch!
  `;

  console.log('\n=== OCR PARSING EXAMPLE ===\n');
  console.log('Raw Receipt Text:', rawReceiptText.substring(0, 100) + '...\n');

  const parsedData = agent.parseReceiptText(rawReceiptText);
  console.log('Parsed Data:');
  console.log(`- Date: ${parsedData.date}`);
  console.log(`- Total: ${parsedData.totalAmount?.toFixed(2)}€`);
  console.log(`- Line Items: ${parsedData.lineItems?.length} items found`);
  
  parsedData.lineItems?.forEach(item => {
    console.log(`  • ${item.category}: ${item.amount.toFixed(2)}€ (${item.vatRate}% VAT)`);
  });
};

/**
 * Example 5: Business Purpose Suggestions
 * Get intelligent suggestions based on participants
 */
export const businessPurposeSuggestionExample = (): void => {
  console.log('\n=== BUSINESS PURPOSE SUGGESTIONS ===\n');

  // Customer meeting scenario
  const customerParticipants: Participant[] = [
    { name: 'Customer A', company: 'Client Corp', role: 'customer', isExternal: true },
    { name: 'Sales Manager', company: 'Our Company', role: 'employee', isExternal: false }
  ];

  console.log('Customer Meeting Suggestions:');
  const customerSuggestions = agent.suggestBusinessPurpose(customerParticipants);
  customerSuggestions.forEach(s => console.log(`- ${s}`));

  // Team event scenario
  const teamParticipants: Participant[] = [
    { name: 'Team Lead', company: 'Our Company', role: 'employee', isExternal: false },
    { name: 'Developer 1', company: 'Our Company', role: 'employee', isExternal: false },
    { name: 'Developer 2', company: 'Our Company', role: 'employee', isExternal: false }
  ];

  console.log('\nTeam Event Suggestions:');
  const teamSuggestions = agent.suggestBusinessPurpose(teamParticipants);
  teamSuggestions.forEach(s => console.log(`- ${s}`));
};

/**
 * Run all examples
 */
export const runAllExamples = (): void => {
  customerEntertainmentExample();
  employeeEntertainmentExample();
  excessiveAmountExample();
  ocrParsingExample();
  businessPurposeSuggestionExample();
};

// Export for use in tests or API
export { agent };
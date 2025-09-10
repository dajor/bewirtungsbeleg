/**
 * Bewirtungsbelege Business Intelligence Agent
 * 
 * This agent understands German hospitality receipt regulations and provides
 * intelligent assistance for tax-compliant receipt processing.
 */

export interface Participant {
  name: string;
  company?: string;
  role: 'customer' | 'prospect' | 'supplier' | 'employee' | 'partner';
  isExternal: boolean;
}

export interface ReceiptLineItem {
  description: string;
  amount: number;
  category: 'meal' | 'beverage' | 'tip' | 'other';
  vatRate: 7 | 19 | 0;
  quantity?: number;
}

export interface BewirtungsbelegData {
  vendor: string;
  date: string;
  totalAmount: number;
  participants: Participant[];
  businessPurpose: string;
  lineItems: ReceiptLineItem[];
  location?: string;
  receiptNumber?: string;
}

export interface TaxCalculation {
  entertainmentType: 'geschäftlich' | 'betrieblich';
  meals: {
    gross: number;
    net: number;
    vat: number;
    deductible70: number;
    nonDeductible30: number;
  };
  beverages: {
    gross: number;
    net: number;
    vat: number;
    deductible70: number;
    nonDeductible30: number;
  };
  tips: {
    amount: number;
    deductible70: number;
    nonDeductible30: number;
  };
  totals: {
    gross: number;
    totalDeductible: number;
    totalNonDeductible: number;
    totalVat: number;
  };
}

export interface BookingEntries {
  accountingSystem: 'SKR03' | 'SKR04';
  entries: Array<{
    account: string;
    description: string;
    amount: number;
    vatAmount?: number;
    vatRate?: number;
    deductible: boolean;
  }>;
}

export interface ComplianceCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Main Business Intelligence Agent for Bewirtungsbelege
 */
export class BewirtungsbelegAgent {
  // Account mappings for different accounting systems
  private readonly ACCOUNTS = {
    SKR03: {
      geschäftlich: {
        deductible: '4650',
        nonDeductible: '4654'
      },
      betrieblich: {
        deductible: '4631',
        nonDeductible: null // 100% deductible
      }
    },
    SKR04: {
      geschäftlich: {
        deductible: '6640',
        nonDeductible: '6644'
      },
      betrieblich: {
        deductible: '6620',
        nonDeductible: null
      }
    }
  };

  // Reasonableness thresholds
  private readonly THRESHOLDS = {
    perPersonLimit: 150,      // EUR per person warning
    perPersonCritical: 250,   // EUR per person error
    totalLimit: 1000,         // Total amount warning
    tipPercentageNormal: 10,  // Normal tip percentage
    tipPercentageHigh: 15,    // High tip percentage warning
    minParticipants: 2,       // Minimum for entertainment
    maxParticipants: 20       // Maximum reasonable group size
  };

  /**
   * Determine entertainment type based on participants
   */
  public classifyEntertainmentType(participants: Participant[]): 'geschäftlich' | 'betrieblich' {
    const hasExternal = participants.some(p => p.isExternal);
    return hasExternal ? 'geschäftlich' : 'betrieblich';
  }

  /**
   * Analyze participants and provide insights
   */
  public analyzeParticipants(participants: Participant[]): {
    type: 'geschäftlich' | 'betrieblich';
    externalCount: number;
    internalCount: number;
    requiresSplit: boolean;
    description: string;
  } {
    const externalCount = participants.filter(p => p.isExternal).length;
    const internalCount = participants.filter(p => !p.isExternal).length;
    const type = this.classifyEntertainmentType(participants);

    return {
      type,
      externalCount,
      internalCount,
      requiresSplit: type === 'geschäftlich',
      description: type === 'geschäftlich' 
        ? `Geschäftliche Bewirtung (${externalCount} externe, ${internalCount} interne Teilnehmer) - 70/30 Aufteilung erforderlich`
        : `Betriebliche Bewirtung (nur Mitarbeiter) - 100% abzugsfähig bei angemessenem Anlass`
    };
  }

  /**
   * Calculate tax split for entertainment expenses
   */
  public calculateTaxSplit(data: BewirtungsbelegData): TaxCalculation {
    const type = this.classifyEntertainmentType(data.participants);
    const isGeschäftlich = type === 'geschäftlich';

    // Group line items by category
    const meals = data.lineItems.filter(i => i.category === 'meal');
    const beverages = data.lineItems.filter(i => i.category === 'beverage');
    const tips = data.lineItems.filter(i => i.category === 'tip');

    // Calculate meal totals
    const mealGross = meals.reduce((sum, item) => sum + item.amount, 0);
    const mealVat = this.calculateVAT(mealGross, 7);
    const mealNet = mealGross - mealVat;

    // Calculate beverage totals
    const beverageGross = beverages.reduce((sum, item) => sum + item.amount, 0);
    const beverageVat = this.calculateVAT(beverageGross, 19);
    const beverageNet = beverageGross - beverageVat;

    // Calculate tip totals (no VAT)
    const tipAmount = tips.reduce((sum, item) => sum + item.amount, 0);

    // Apply 70/30 split for geschäftlich, 100/0 for betrieblich
    const splitRatio = isGeschäftlich ? 0.7 : 1.0;

    return {
      entertainmentType: type,
      meals: {
        gross: mealGross,
        net: mealNet,
        vat: mealVat,
        deductible70: mealGross * splitRatio,
        nonDeductible30: mealGross * (1 - splitRatio)
      },
      beverages: {
        gross: beverageGross,
        net: beverageNet,
        vat: beverageVat,
        deductible70: beverageGross * splitRatio,
        nonDeductible30: beverageGross * (1 - splitRatio)
      },
      tips: {
        amount: tipAmount,
        deductible70: tipAmount * splitRatio,
        nonDeductible30: tipAmount * (1 - splitRatio)
      },
      totals: {
        gross: mealGross + beverageGross + tipAmount,
        totalDeductible: (mealGross + beverageGross + tipAmount) * splitRatio,
        totalNonDeductible: (mealGross + beverageGross + tipAmount) * (1 - splitRatio),
        totalVat: mealVat + beverageVat
      }
    };
  }

  /**
   * Generate booking entries for accounting
   */
  public generateBookingEntries(
    data: BewirtungsbelegData, 
    accountingSystem: 'SKR03' | 'SKR04' = 'SKR03'
  ): BookingEntries {
    const calculation = this.calculateTaxSplit(data);
    const accounts = this.ACCOUNTS[accountingSystem][calculation.entertainmentType];
    const entries: BookingEntries['entries'] = [];

    if (calculation.entertainmentType === 'geschäftlich') {
      // Customer entertainment - 6 entries
      
      // Meals 70% deductible
      if (calculation.meals.deductible70 > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Bewirtung Speisen (70% abzugsfähig)',
          amount: calculation.meals.deductible70 - (calculation.meals.vat * 0.7),
          vatAmount: calculation.meals.vat * 0.7,
          vatRate: 7,
          deductible: true
        });
      }

      // Meals 30% non-deductible
      if (calculation.meals.nonDeductible30 > 0) {
        entries.push({
          account: accounts.nonDeductible!,
          description: 'Bewirtung Speisen (30% nicht abzugsfähig)',
          amount: calculation.meals.nonDeductible30 - (calculation.meals.vat * 0.3),
          vatAmount: calculation.meals.vat * 0.3,
          vatRate: 7,
          deductible: false
        });
      }

      // Beverages 70% deductible
      if (calculation.beverages.deductible70 > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Bewirtung Getränke (70% abzugsfähig)',
          amount: calculation.beverages.deductible70 - (calculation.beverages.vat * 0.7),
          vatAmount: calculation.beverages.vat * 0.7,
          vatRate: 19,
          deductible: true
        });
      }

      // Beverages 30% non-deductible
      if (calculation.beverages.nonDeductible30 > 0) {
        entries.push({
          account: accounts.nonDeductible!,
          description: 'Bewirtung Getränke (30% nicht abzugsfähig)',
          amount: calculation.beverages.nonDeductible30 - (calculation.beverages.vat * 0.3),
          vatAmount: calculation.beverages.vat * 0.3,
          vatRate: 19,
          deductible: false
        });
      }

      // Tips 70% deductible
      if (calculation.tips.deductible70 > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Trinkgeld (70% abzugsfähig)',
          amount: calculation.tips.deductible70,
          deductible: true
        });
      }

      // Tips 30% non-deductible
      if (calculation.tips.nonDeductible30 > 0) {
        entries.push({
          account: accounts.nonDeductible!,
          description: 'Trinkgeld (30% nicht abzugsfähig)',
          amount: calculation.tips.nonDeductible30,
          deductible: false
        });
      }
    } else {
      // Employee entertainment - simpler booking
      
      if (calculation.meals.gross > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Betriebliche Bewirtung Speisen',
          amount: calculation.meals.net,
          vatAmount: calculation.meals.vat,
          vatRate: 7,
          deductible: true
        });
      }

      if (calculation.beverages.gross > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Betriebliche Bewirtung Getränke',
          amount: calculation.beverages.net,
          vatAmount: calculation.beverages.vat,
          vatRate: 19,
          deductible: true
        });
      }

      if (calculation.tips.amount > 0) {
        entries.push({
          account: accounts.deductible,
          description: 'Betriebliche Bewirtung Trinkgeld',
          amount: calculation.tips.amount,
          deductible: true
        });
      }
    }

    return {
      accountingSystem,
      entries
    };
  }

  /**
   * Validate compliance with German tax regulations
   */
  public validateCompliance(data: BewirtungsbelegData): ComplianceCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required fields check
    if (!data.vendor) errors.push('Bewirtungsstätte/Restaurant fehlt');
    if (!data.date) errors.push('Datum der Bewirtung fehlt');
    if (!data.businessPurpose) errors.push('Geschäftlicher Anlass fehlt');
    if (!data.participants || data.participants.length === 0) {
      errors.push('Teilnehmerliste fehlt');
    }

    // Participant validation
    if (data.participants.length < this.THRESHOLDS.minParticipants) {
      warnings.push('Mindestens 2 Teilnehmer erforderlich für Bewirtung');
    }
    if (data.participants.length > this.THRESHOLDS.maxParticipants) {
      warnings.push(`Mehr als ${this.THRESHOLDS.maxParticipants} Teilnehmer - Prüfung der Angemessenheit empfohlen`);
    }

    // Amount reasonableness
    const perPersonAmount = data.totalAmount / data.participants.length;
    if (perPersonAmount > this.THRESHOLDS.perPersonCritical) {
      errors.push(`Betrag pro Person (${perPersonAmount.toFixed(2)}€) überschreitet kritische Grenze`);
    } else if (perPersonAmount > this.THRESHOLDS.perPersonLimit) {
      warnings.push(`Betrag pro Person (${perPersonAmount.toFixed(2)}€) ist ungewöhnlich hoch`);
    }

    // Business purpose quality
    if (data.businessPurpose && data.businessPurpose.length < 10) {
      warnings.push('Geschäftlicher Anlass sollte ausführlicher beschrieben werden');
    }

    // Line items validation
    if (!data.lineItems || data.lineItems.length === 0) {
      warnings.push('Keine Einzelpositionen erfasst - Aufteilung nach Speisen/Getränken empfohlen');
    } else {
      const hasFood = data.lineItems.some(i => i.category === 'meal');
      const hasDrinks = data.lineItems.some(i => i.category === 'beverage');
      
      if (!hasFood && !hasDrinks) {
        warnings.push('Keine Speisen oder Getränke kategorisiert');
      }

      // Check tip percentage
      const tipAmount = data.lineItems
        .filter(i => i.category === 'tip')
        .reduce((sum, i) => sum + i.amount, 0);
      
      const beforeTip = data.totalAmount - tipAmount;
      const tipPercentage = (tipAmount / beforeTip) * 100;
      
      if (tipPercentage > this.THRESHOLDS.tipPercentageHigh) {
        warnings.push(`Trinkgeld (${tipPercentage.toFixed(1)}%) ist ungewöhnlich hoch`);
      }
    }

    // Suggestions for improvement
    if (data.participants.some(p => !p.company)) {
      suggestions.push('Firmenzugehörigkeit aller Teilnehmer erfassen für bessere Dokumentation');
    }

    if (!data.receiptNumber) {
      suggestions.push('Belegnummer erfassen für eindeutige Zuordnung');
    }

    const participantAnalysis = this.analyzeParticipants(data.participants);
    if (participantAnalysis.type === 'geschäftlich' && participantAnalysis.internalCount > participantAnalysis.externalCount * 2) {
      suggestions.push('Verhältnis interner zu externer Teilnehmer prüfen (Angemessenheit)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Provide intelligent recommendations
   */
  public getRecommendations(data: BewirtungsbelegData): string[] {
    const recommendations: string[] = [];
    const validation = this.validateCompliance(data);
    const calculation = this.calculateTaxSplit(data);

    // Tax optimization tips
    if (calculation.entertainmentType === 'geschäftlich') {
      recommendations.push(
        `💡 Steuerhinweis: ${calculation.totals.totalDeductible.toFixed(2)}€ (70%) sind abzugsfähig, ` +
        `${calculation.totals.totalNonDeductible.toFixed(2)}€ (30%) nicht abzugsfähig`
      );
    }

    // Documentation tips
    if (!validation.isValid) {
      recommendations.push('⚠️ Beleg unvollständig - alle Pflichtfelder ausfüllen für Betriebsprüfungssicherheit');
    }

    // Cost saving tips
    const perPerson = data.totalAmount / data.participants.length;
    if (perPerson > 100) {
      recommendations.push(
        '💰 Tipp: Bei Beträgen über 100€/Person genauere Dokumentation des Anlasses empfohlen'
      );
    }

    // VAT optimization
    if (calculation.beverages.gross > calculation.meals.gross) {
      recommendations.push(
        '📊 Hinweis: Getränkeanteil höher als Speisen - höhere Umsatzsteuer (19% statt 7%)'
      );
    }

    return recommendations;
  }

  /**
   * Parse natural language receipt description
   */
  public parseReceiptText(text: string): Partial<BewirtungsbelegData> {
    const data: Partial<BewirtungsbelegData> = {};
    const lines = text.split('\n');
    const lineItems: ReceiptLineItem[] = [];

    // Pattern matching for common receipt formats
    const patterns = {
      date: /(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/,
      amount: /(?:€\s*)?(\d+[,.]?\d{0,2})\s*€?/,
      meal: /(?:speise|essen|menü|gericht|pizza|pasta|burger|salat|suppe)/i,
      beverage: /(?:getränk|bier|wein|wasser|cola|kaffee|saft|spirituosen)/i,
      tip: /(?:trinkgeld|tip|bedienung)/i,
      vat7: /(?:7\s*%|MwSt.*7)/,
      vat19: /(?:19\s*%|MwSt.*19)/
    };

    lines.forEach(line => {
      // Try to identify line items
      const amountMatch = line.match(patterns.amount);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(',', '.'));
        
        let category: ReceiptLineItem['category'] = 'other';
        let vatRate: ReceiptLineItem['vatRate'] = 19;

        if (patterns.meal.test(line)) {
          category = 'meal';
          vatRate = 7;
        } else if (patterns.beverage.test(line)) {
          category = 'beverage';
          vatRate = 19;
        } else if (patterns.tip.test(line)) {
          category = 'tip';
          vatRate = 0;
        }

        if (patterns.vat7.test(line)) vatRate = 7;
        if (patterns.vat19.test(line)) vatRate = 19;

        lineItems.push({
          description: line.trim(),
          amount,
          category,
          vatRate
        });
      }

      // Extract date
      const dateMatch = line.match(patterns.date);
      if (dateMatch && !data.date) {
        data.date = this.normalizeDate(dateMatch[1]);
      }
    });

    if (lineItems.length > 0) {
      data.lineItems = lineItems;
      data.totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    }

    return data;
  }

  /**
   * Smart suggestions for business purpose based on participants
   */
  public suggestBusinessPurpose(participants: Participant[]): string[] {
    const suggestions: string[] = [];
    const hasCustomers = participants.some(p => p.role === 'customer');
    const hasProspects = participants.some(p => p.role === 'prospect');
    const hasSuppliers = participants.some(p => p.role === 'supplier');
    const onlyEmployees = participants.every(p => p.role === 'employee');

    if (hasCustomers) {
      suggestions.push('Kundenpflege und Beziehungsmanagement');
      suggestions.push('Besprechung laufender Projekte');
      suggestions.push('Vertragsverhandlungen');
    }

    if (hasProspects) {
      suggestions.push('Akquisegespräch Neukundengewinnung');
      suggestions.push('Produktpräsentation und Beratung');
      suggestions.push('Erstgespräch Geschäftsanbahnung');
    }

    if (hasSuppliers) {
      suggestions.push('Lieferantengespräch Konditionen');
      suggestions.push('Qualitätssicherung und Prozessoptimierung');
      suggestions.push('Jahresgespräch Zusammenarbeit');
    }

    if (onlyEmployees) {
      suggestions.push('Teambuilding Abteilung');
      suggestions.push('Projektabschluss Feier');
      suggestions.push('Strategiebesprechung Quartalsziele');
      suggestions.push('Mitarbeitergespräch Entwicklung');
    }

    return suggestions;
  }

  // Helper methods
  private calculateVAT(gross: number, rate: number): number {
    return gross - (gross / (1 + rate / 100));
  }

  private normalizeDate(dateStr: string): string {
    // Convert various date formats to DD.MM.YYYY
    const parts = dateStr.split(/[.\/-]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = '20' + year;
      }
      return `${day}.${month}.${year}`;
    }
    return dateStr;
  }
}

// Export singleton instance
export const bewirtungsbelegAgent = new BewirtungsbelegAgent();
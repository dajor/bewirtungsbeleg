/**
 * API Route for Bewirtungsbelege Business Intelligence Agent
 * Provides intelligent analysis and recommendations for German hospitality receipts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bewirtungsbelegAgent } from '@/lib/bewirtungsbelege-agent';
import type { 
  BewirtungsbelegData, 
  Participant 
} from '@/lib/bewirtungsbelege-agent';

// Request validation schemas
const ParticipantSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  role: z.enum(['customer', 'prospect', 'supplier', 'employee', 'partner']),
  isExternal: z.boolean()
});

const LineItemSchema = z.object({
  description: z.string(),
  amount: z.number(),
  category: z.enum(['meal', 'beverage', 'tip', 'other']),
  vatRate: z.union([z.literal(0), z.literal(7), z.literal(19)]),
  quantity: z.number().optional()
});

const AnalyzeRequestSchema = z.object({
  action: z.enum([
    'classify', 
    'calculate', 
    'validate', 
    'generateBookings', 
    'recommend',
    'suggestPurpose',
    'parseText'
  ]),
  data: z.object({
    vendor: z.string().optional(),
    date: z.string().optional(),
    totalAmount: z.number().optional(),
    businessPurpose: z.string().optional(),
    location: z.string().optional(),
    receiptNumber: z.string().optional(),
    participants: z.array(ParticipantSchema).optional(),
    lineItems: z.array(LineItemSchema).optional(),
    rawText: z.string().optional(),
    accountingSystem: z.enum(['SKR03', 'SKR04']).optional()
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedRequest = AnalyzeRequestSchema.parse(body);
    const { action, data } = validatedRequest;

    // Prepare receipt data (if needed)
    const receiptData: BewirtungsbelegData = {
      vendor: data.vendor || '',
      date: data.date || '',
      totalAmount: data.totalAmount || 0,
      businessPurpose: data.businessPurpose || '',
      participants: data.participants || [],
      lineItems: data.lineItems || [],
      location: data.location,
      receiptNumber: data.receiptNumber
    };

    // Execute requested action
    switch (action) {
      case 'classify': {
        if (!data.participants || data.participants.length === 0) {
          return NextResponse.json(
            { error: 'Participants required for classification' },
            { status: 400 }
          );
        }
        
        const analysis = bewirtungsbelegAgent.analyzeParticipants(data.participants);
        return NextResponse.json({
          success: true,
          result: analysis
        });
      }

      case 'calculate': {
        const calculation = bewirtungsbelegAgent.calculateTaxSplit(receiptData);
        return NextResponse.json({
          success: true,
          result: calculation
        });
      }

      case 'validate': {
        const validation = bewirtungsbelegAgent.validateCompliance(receiptData);
        return NextResponse.json({
          success: true,
          result: validation
        });
      }

      case 'generateBookings': {
        const accountingSystem = data.accountingSystem || 'SKR03';
        const bookings = bewirtungsbelegAgent.generateBookingEntries(
          receiptData, 
          accountingSystem
        );
        return NextResponse.json({
          success: true,
          result: bookings
        });
      }

      case 'recommend': {
        const recommendations = bewirtungsbelegAgent.getRecommendations(receiptData);
        return NextResponse.json({
          success: true,
          result: recommendations
        });
      }

      case 'suggestPurpose': {
        if (!data.participants || data.participants.length === 0) {
          return NextResponse.json(
            { error: 'Participants required for purpose suggestions' },
            { status: 400 }
          );
        }
        
        const suggestions = bewirtungsbelegAgent.suggestBusinessPurpose(data.participants);
        return NextResponse.json({
          success: true,
          result: suggestions
        });
      }

      case 'parseText': {
        if (!data.rawText) {
          return NextResponse.json(
            { error: 'Raw text required for parsing' },
            { status: 400 }
          );
        }
        
        const parsed = bewirtungsbelegAgent.parseReceiptText(data.rawText);
        return NextResponse.json({
          success: true,
          result: parsed
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Agent API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for agent capabilities and documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Bewirtungsbelege Business Intelligence Agent',
    version: '1.0.0',
    capabilities: [
      {
        action: 'classify',
        description: 'Classify entertainment type based on participants',
        required: ['participants']
      },
      {
        action: 'calculate',
        description: 'Calculate 70/30 tax split for expenses',
        required: ['lineItems', 'participants']
      },
      {
        action: 'validate',
        description: 'Validate receipt compliance with German tax law',
        required: ['vendor', 'date', 'participants', 'businessPurpose']
      },
      {
        action: 'generateBookings',
        description: 'Generate accounting entries for SKR03/SKR04',
        required: ['lineItems', 'participants'],
        optional: ['accountingSystem']
      },
      {
        action: 'recommend',
        description: 'Get intelligent recommendations for the receipt',
        required: ['participants', 'totalAmount']
      },
      {
        action: 'suggestPurpose',
        description: 'Suggest business purposes based on participants',
        required: ['participants']
      },
      {
        action: 'parseText',
        description: 'Parse unstructured receipt text',
        required: ['rawText']
      }
    ],
    taxRules: {
      deductibility: {
        customer: '70% deductible, 30% non-deductible',
        employee: '100% potentially deductible'
      },
      vatRates: {
        meals: 7,
        beverages: 19,
        tips: 0
      },
      accounts: {
        SKR03: {
          customerDeductible: '4650',
          customerNonDeductible: '4654',
          employeeDeductible: '4631'
        },
        SKR04: {
          customerDeductible: '6640',
          customerNonDeductible: '6644',
          employeeDeductible: '6620'
        }
      }
    },
    thresholds: {
      perPersonWarning: 150,
      perPersonCritical: 250,
      tipPercentageNormal: 10,
      tipPercentageHigh: 15
    }
  });
}
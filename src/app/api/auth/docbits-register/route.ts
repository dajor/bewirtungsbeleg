/**
 * DocBits User Registration API Route
 *
 * POST /api/auth/docbits-register
 * Creates a new user account in DocBits
 */

import { NextRequest, NextResponse } from 'next/server';
import { docbitsRegister, DocBitsAuthError } from '@/lib/docbits-auth';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  first_name: z.string().min(1, 'Vorname ist erforderlich'),
  last_name: z.string().min(1, 'Nachname ist erforderlich'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Register user with DocBits
    const user = await docbitsRegister(validatedData);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.user_id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle DocBits authentication errors
    if (error instanceof DocBitsAuthError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode || 400 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validierungsfehler',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Ein unerwarteter Fehler ist aufgetreten',
      },
      { status: 500 }
    );
  }
}

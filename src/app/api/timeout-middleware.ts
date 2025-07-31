import { NextRequest, NextResponse } from 'next/server';

// Global timeout configuration for API routes
export const API_TIMEOUT_MS = 60000; // 60 seconds global timeout

export function withTimeout<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  timeoutMs: number = API_TIMEOUT_MS
): T {
  return (async (...args: Parameters<T>): Promise<NextResponse> => {
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      // Race between the actual handler and timeout
      const response = await Promise.race([
        handler(...args),
        timeoutPromise
      ]);
      
      return response;
    } catch (error) {
      console.error('Request timeout or error:', error);
      
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'Die Anfrage hat zu lange gedauert und wurde abgebrochen.',
            timeout: timeoutMs
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      throw error;
    }
  }) as T;
}
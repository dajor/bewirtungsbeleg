import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = request.nextUrl.pathname === '/' || 
                       request.nextUrl.pathname === '/release-notes' ||
                       request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/generate-pdf');

  // Allow auth API routes and public routes
  if (isApiAuthRoute || (isPublicRoute && !request.nextUrl.pathname.startsWith('/api/generate-pdf'))) {
    return NextResponse.next();
  }

  // Redirect to signin if not authenticated and trying to access protected route
  if (!token && !isAuthPage) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to main app if authenticated and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/bewirtungsbeleg', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.webmanifest|.*\\.pdf|.*\\.txt|.*\\.json).*)',
  ],
};
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from './lib/auth';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/signin', '/signup', '/verify-otp', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session_token')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    const payload = await verifySessionToken(sessionToken);
    if (!payload) {
        // Clear invalid cookie
        const response = NextResponse.redirect(new URL('/signin', request.url));
        response.cookies.delete('session_token');
        return response;
    }
  }

  if (isAuthRoute && sessionToken) {
    const payload = await verifySessionToken(sessionToken);
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

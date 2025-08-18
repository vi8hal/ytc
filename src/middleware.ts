
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from './lib/auth';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/signin', '/signup', '/verify-otp', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session_token')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // --- Handle Protected Routes ---
  if (isProtectedRoute) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    try {
      const payload = await verifySessionToken(sessionToken);
      if (!payload) {
          const response = NextResponse.redirect(new URL('/signin', request.url));
          response.cookies.delete('session_token');
          return response;
      }
    } catch(e) {
       const response = NextResponse.redirect(new URL('/signin', request.url));
       response.cookies.delete('session_token');
       return response;
    }
  }

  // --- Handle Authentication Routes ---
  if (isAuthRoute) {
    if (sessionToken) {
        try {
            const payload = await verifySessionToken(sessionToken);
            if (payload) {
                // If user has a valid session, redirect them from auth pages to the dashboard.
                // Exception: allow them to visit /verify-otp if they are somehow still on it.
                if (pathname === '/verify-otp') {
                    return NextResponse.next();
                }
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (e) {
            // Invalid session token is fine, let them proceed to the auth page.
        }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

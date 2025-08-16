
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
                // Allow access to /verify-otp if they have a verification_token,
                if (pathname === '/verify-otp' && request.cookies.has('verification_token')) {
                    return NextResponse.next();
                }
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (e) {
            // Invalid session token, let them proceed to the auth page.
        }
    }
  }
  
  // --- Special Case for /verify-otp ---
  // Prevent direct navigation to /verify-otp without a token
  if (pathname === '/verify-otp' && !request.cookies.has('verification_token')) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

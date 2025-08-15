
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
      console.log(`No session token, redirecting from protected route ${pathname} to /signin`);
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    try {
      const payload = await verifySessionToken(sessionToken);
      if (!payload) {
          console.log(`Invalid session token, redirecting from protected route ${pathname} to /signin`);
          const response = NextResponse.redirect(new URL('/signin', request.url));
          response.cookies.delete('session_token');
          return response;
      }
    } catch(e) {
       console.log(`Token verification error, redirecting from protected route ${pathname} to /signin`);
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
                // If user is logged in, redirect them away from auth pages to the dashboard.
                // Exception: Allow access to /verify-otp if they have a verification_token,
                // which can happen in a re-verification flow.
                if (pathname === '/verify-otp' && request.cookies.has('verification_token')) {
                    return NextResponse.next();
                }
                console.log(`Logged-in user tried to access auth route ${pathname}, redirecting to /dashboard`);
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        } catch (e) {
            // Invalid session token, let them proceed to the auth page.
        }
    }
  }
  
  // --- Special Case for /verify-otp ---
  // Ensure the /verify-otp page is only accessible if a verification_token exists.
  // This prevents users from navigating to it directly without initiating a sign-up or sign-in.
  if (pathname === '/verify-otp' && !request.cookies.has('verification_token')) {
    console.log('User tried to access /verify-otp without a verification token, redirecting to /signup');
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

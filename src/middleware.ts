
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
      // Allow access to /verify-otp even if logged in, in case of re-verification flow
      if(pathname === '/verify-otp' && request.cookies.has('verification_token')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // If on /verify-otp page, ensure there is a verification token
  if(pathname === '/verify-otp' && !request.cookies.has('verification_token')) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from './lib/auth';
import type { JWTPayload } from 'jose';

const PROTECTED_ROUTES = ['/dashboard'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/signin', '/signup', '/verify-otp', '/forgot-password', '/reset-password'];

async function getSession(request: NextRequest): Promise<JWTPayload | null> {
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) return null;

    try {
        return await verifySessionToken(sessionToken);
    } catch (e) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const session = await getSession(request);

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  const isLandingPage = pathname === '/';

  // --- Handle Admin Routes ---
  if (isAdminRoute) {
      if (!session || !session.isAdmin) {
          return NextResponse.redirect(new URL('/signin', request.url));
      }
  }

  // --- Handle Protected Routes ---
  if (isProtectedRoute) {
    if (!session) {
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('session_token');
      return response;
    }
    // Redirect admin away from regular user dashboard
    if (session.isAdmin) {
       return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // --- Handle Authentication Routes & Landing Page ---
  if (isAuthRoute || isLandingPage) {
    if (session) {
       if (session.isAdmin) {
           return NextResponse.redirect(new URL('/admin/dashboard', request.url));
       }
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

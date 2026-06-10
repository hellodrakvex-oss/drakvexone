import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/setup', '/demo'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/'];

// Silent error handler — never leaks internals to logs in production
function handleMiddlewareError(_label: string, _error: unknown) {
  // Errors are silently swallowed; session will be null and the request
  // will be redirected to /login by the protected-route guard below.
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  if (!isPublicRoute && !isProtectedRoute) {
    // Other routes - allow through

    return NextResponse.next();
  }

  // Create Supabase client with request/response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let session: Session | null = null;

  try {
    const sessionResult = await supabase.auth.getSession();
    session = sessionResult.data.session ?? null;
  } catch (error) {
    handleMiddlewareError('auth.getSession', error);
  }

  // If trying to access protected route without session
  if (isProtectedRoute && !session) {

    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAuthRoute = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  // If user has a session, we need to check if they have completed setup
  if (session) {
    // Only fetch profile if they are trying to access protected routes OR auth routes
    if (isProtectedRoute || isAuthRoute || pathname === '/setup') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('shop_name')
        .eq('id', session.user.id)
        .maybeSingle();



      if (profile?.shop_name) {
        // User has a shop
        if (isAuthRoute || pathname === '/setup') {
          // If trying to access auth pages or setup page, redirect to dashboard

          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } else {
        // User does not have a shop
        if (pathname !== '/setup' && !isAuthRoute) {
          // Redirect to setup unless they are on an auth route or setup

          return NextResponse.redirect(new URL('/setup', request.url));
        }
      }
    }
  }


  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

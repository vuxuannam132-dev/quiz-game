import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protect admin routes - require admin or teacher role
    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      if (token.role !== 'admin' && token.role !== 'teacher') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Public paths
        if (
          pathname.startsWith('/room') ||
          pathname.startsWith('/api/room') ||
          pathname.startsWith('/api/answer') ||
          pathname.startsWith('/api/leaderboard') ||
          pathname === '/login' ||
          pathname === '/'
        ) {
          return true;
        }
        // Protected: must have token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/questions/:path*',
    '/api/room/create',
    '/api/upload',
  ],
};

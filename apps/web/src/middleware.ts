import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - api/* (all other API routes — handle their own auth)
     * - login (login page)
     * - _next/static, _next/image (Next.js internals)
     * - public files (favicon, icon, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|login).*)',
  ],
};
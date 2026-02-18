
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. SKIP REWRITES FOR SYSTEM PATHS AND ALL API ROUTES
  // Next.js 15 compatibility: explicit checks
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    url.pathname.includes('.') // Skip files with extensions (favicon.ico, images, etc.)
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";

  // 2. Extract subdomain
  // Use a more robust way to check for root domain including optional port
  const hostWithoutPort = hostname.split(':')[0];
  const isRoot = hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`;

  if (isRoot) {
    return NextResponse.next();
  }

  // Handle subdomains (e.g., sam.schoolbd.top)
  const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');

  if (!subdomain || subdomain === hostWithoutPort) {
    return NextResponse.next();
  }

  // 3. The Rewrite Rule: Rewrite subdomain to dynamic route /[username]/...
  // This maps sam.schoolbd.top/admin to /sam/admin internally
  const targetPath = `/${subdomain}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

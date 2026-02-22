
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. SKIP REWRITES FOR SYSTEM PATHS AND ALL API ROUTES
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next();
  }

  // Handle static files. 
  // We want to skip them UNLESS they are our specific dynamic files that vary by subdomain.
  const dynamicFiles = ['/sitemap.xml', '/robots.txt', '/manifest.json', '/sw.js'];
  const isStaticFile = url.pathname.includes('.');
  
  if (isStaticFile && !dynamicFiles.includes(url.pathname)) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";

  // 2. Extract subdomain
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
  // This maps sam.schoolbd.top/sitemap.xml to /sam/sitemap.xml internally
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

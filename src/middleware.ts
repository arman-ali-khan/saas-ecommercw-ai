
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. SKIP REWRITES FOR DEVELOPMENT TOOLS AND SYSTEM PATHS
  const isDev = 
    hostname.includes('cloudworkstations.dev') || 
    hostname.includes('localhost') || 
    hostname.includes('vercel.app');

  // Skip for all API routes, static files, and internal Next.js paths
  if (
    isDev || 
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";

  // 2. Extract subdomain
  if (!hostname.includes(rootDomain)) {
    return NextResponse.next();
  }

  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(rootDomain, '');

  // 3. Avoid rewriting the main domain or 'www'
  if (!subdomain || subdomain === 'www' || subdomain === '') {
    return NextResponse.next();
  }

  // 4. The Rewrite Rule
  const targetPath = `/${subdomain}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

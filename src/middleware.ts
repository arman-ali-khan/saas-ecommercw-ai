import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');

  // Your main domain, now dynamically from an environment variable with a fallback.
  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";

  // Extract subdomain (e.g., 'student1' from 'student1.schoolbd.top')
  const subdomain = hostname?.replace(`.${rootDomain}`, '');

  // 1. Avoid rewriting the main domain or 'www'
  if (!subdomain || subdomain === rootDomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // 2. The Rewrite Rule
  // Current Path: url.pathname (e.g., /admin)
  // Target Path: /[subdomain]/admin
  const targetPath = `/${subdomain}${url.pathname}${url.search}`;
  
  return NextResponse.rewrite(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and internal Next.js files
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

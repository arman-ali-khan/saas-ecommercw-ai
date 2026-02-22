
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. SKIP REWRITES FOR SYSTEM PATHS AND ALL API ROUTES
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    url.pathname.includes('.') // Static files
  ) {
    // Exception for specific dynamic files
    const dynamicFiles = ['/sitemap.xml', '/robots.txt', '/manifest.json', '/sw.js'];
    if (!dynamicFiles.includes(url.pathname)) {
        return NextResponse.next();
    }
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  const hostWithoutPort = hostname.split(':')[0];
  const isRoot = hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`;

  if (isRoot) {
    return NextResponse.next();
  }

  // 2. Resolve Subdomain or Custom Domain
  let username = '';

  // Check if it's a subdomain of our root domain
  if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
    username = hostWithoutPort.replace(`.${rootDomain}`, '');
  } else {
    // If not a subdomain, it might be a CUSTOM DOMAIN
    // We need to look up which site this domain belongs to.
    // NOTE: For performance in production, consider caching this lookup (e.g. Upstash Redis).
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { data } = await supabase
            .from('profiles')
            .select('domain')
            .eq('custom_domain', hostWithoutPort)
            .single();
        
        if (data) {
            username = data.domain;
        }
    } catch (e) {
        console.error('Custom domain lookup error:', e);
    }
  }

  if (!username || username === 'www') {
    return NextResponse.next();
  }

  // 3. Rewrite to dynamic route /[username]/...
  const targetPath = `/${username}${url.pathname}${url.search}`;
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

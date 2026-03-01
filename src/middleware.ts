
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. SKIP REWRITES FOR SYSTEM PATHS AND ALL API ROUTES
  // Removed sitemap.xml and robots.txt from early skip to allow them to be rewritten for subdomains
  const globalSystemFiles = ['/favicon.ico', '/firebase-messaging-sw.js'];
  
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    globalSystemFiles.includes(url.pathname)
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  const hostWithoutPort = hostname.split(':')[0];
  
  // Explicitly ignore localhost and common dev hosts for custom domain lookups
  const isDevHost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1' || hostWithoutPort.includes('workstation');
  const isRoot = hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`;

  // If it's the root domain, serve the platform-level files (from src/app/)
  if (isRoot || (isDevHost && !hostWithoutPort.endsWith(`.${rootDomain}`))) {
    return NextResponse.next();
  }

  // 2. Resolve Subdomain or Custom Domain
  let username = '';

  // Check if it's a subdomain of our root domain
  if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
    username = hostWithoutPort.replace(`.${rootDomain}`, '');
  } else if (!isDevHost) {
    // Only attempt custom domain lookup on production hosts
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
  // This will now catch /sitemap.xml and /robots.txt for subdomains
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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Supports Subdomains (store.schoolbd.top) and Custom Domains (dokanbd.shop).
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. Skip system files, static assets, and API routes
  const globalSystemFiles = ['/favicon.ico', '/sw.js', '/manifest.json', '/robots.txt', '/sitemap.xml', '/logo.png'];
  
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    globalSystemFiles.includes(url.pathname)
  ) {
    return NextResponse.next();
  }

  // Get base domain from env (e.g., schoolbd.top)
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  
  // Normalize host: lowercase and remove port if present
  const host = hostname.split(':')[0].toLowerCase();
  const hostWithoutWww = host.replace(/^www\./, '');
  
  // 2. Identify if this is the Root Platform (SaaS Landing Page)
  const isRootDomain = 
    host === baseDomain || 
    host === `www.${baseDomain}` || 
    host.includes('vercel.app') || 
    host.includes('localhost') || 
    host.includes('workstation');
  
  if (isRootDomain) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve Store Username (Slug)
  
  // Case A: Subdomain resolution (e.g., store1.schoolbd.top)
  if (host.endsWith(`.${baseDomain}`)) {
    username = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
  } 
  // Case B: Custom Domain resolution (e.g., dokanbd.shop)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Check database for a matching custom domain
            // We check both the full host and naked domain version
            const { data: profile } = await supabase
                .from('profiles')
                .select('domain')
                .or(`custom_domain.eq.${host},custom_domain.eq.${hostWithoutWww}`)
                .maybeSingle();
            
            if (profile?.domain) {
                username = profile.domain;
            }
        }
    } catch (e) {
        console.error('Middleware domain resolution error:', e);
    }
  }

  // 4. Internal Rewrite
  // If we found a valid store username, rewrite the path internally
  if (username && username !== 'www') {
    // This allows /[username]/... routes to handle the request seamlessly
    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // Fallback: If no username is resolved, proceed normally 
  // (will likely hit SaaS root or 404 depending on the path)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

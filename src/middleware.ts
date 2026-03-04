
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Supports Subdomains (store.dokanbd.shop) and Custom Domains (yourbrand.com).
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. Skip core system paths, API routes, and static assets
  // Static assets are usually under /_next, /images, /favicon.ico etc.
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    url.pathname.includes('.') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Get base domain from env or default to dokanbd.shop
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dokanbd.shop";
  
  // Normalize host: lowercase and remove port if present
  const host = hostname.split(':')[0].toLowerCase();
  const hostWithoutWww = host.replace(/^www\./, '');
  
  // 2. Identify if this is the Root Platform (SaaS Landing Page)
  // We check baseDomain and common dev/preview domains
  const isRootDomain = 
    host === baseDomain || 
    host === `www.${baseDomain}` || 
    host.endsWith('.vercel.app') || 
    host === 'localhost' || 
    host.includes('workstation') ||
    host.includes('aic6jbiihrhmyrqafasatvzbwe'); // Cloud Workstation specific
  
  // If it's the root domain, allow standard routing
  if (isRootDomain) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve Store Username (Slug)
  
  // Case A: Subdomain resolution (e.g., store1.dokanbd.shop)
  if (host.endsWith(`.${baseDomain}`)) {
    username = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
  } 
  // Case B: Custom Domain resolution (e.g., arman.com)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Search database for a matching custom domain (with and without www)
            // We optimize by querying only once
            const { data: profile } = await supabase
                .from('profiles')
                .select('domain')
                .or(`custom_domain.eq."${host}",custom_domain.eq."${hostWithoutWww}"`)
                .maybeSingle();
            
            if (profile?.domain) {
                username = profile.domain;
            }
        }
    } catch (e) {
        console.error('Middleware resolution error:', e);
    }
  }

  // 4. Internal Rewrite to [username] path
  if (username && username !== 'www') {
    // Prevent infinite rewrite loops
    if (url.pathname.startsWith(`/${username}`)) {
        return NextResponse.next();
    }

    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

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

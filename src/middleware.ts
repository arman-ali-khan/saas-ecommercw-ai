
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

  // Get base domains from env or defaults
  const primaryBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dokanbd.shop";
  const secondaryTenantBaseDomain = 'e-bd.shop';
  
  // Normalize host: lowercase and remove port if present
  const host = hostname.split(':')[0].toLowerCase();
  
  // 2. Identify if this is the Root Platform (SaaS Landing Page)
  const isRootDomain = 
    host === primaryBaseDomain || 
    host === `www.${primaryBaseDomain}` || 
    host === secondaryTenantBaseDomain || 
    host === `www.${secondaryTenantBaseDomain}` || 
    host.endsWith('.vercel.app') || 
    host === 'localhost' || 
    host.includes('workstation') ||
    host.includes('aic6jbiihrhmyrqafasatvzbwe'); 
  
  // If it's the root domain, allow standard routing
  if (isRootDomain) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve Store Username (Slug)
  
  // Case A: Subdomain resolution (e.g., store1.dokanbd.shop or dada.e-bd.shop)
  if (host.endsWith(`.${primaryBaseDomain}`)) {
    username = host.replace(`.${primaryBaseDomain}`, '');
  } else if (host.endsWith(`.${secondaryTenantBaseDomain}`)) {
    username = host.replace(`.${secondaryTenantBaseDomain}`, '');
  }
  // Case B: Custom Domain resolution (e.g., arman.com)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const hostWithoutWww = host.replace(/^www\./, '');
            
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
  
  if (username) {
    username = username.replace(/^www\./, '').trim();
  }

  // 4. Internal Rewrite to [username] path
  if (username && username !== 'www' && username !== '') {
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

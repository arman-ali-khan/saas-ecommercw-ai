
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Supports Subdomains (store.dokanbd.shop) and Custom Domains (arman.com).
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. Skip core system paths and API routes
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next();
  }

  // Get base domain from env (e.g., dokanbd.shop)
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dokanbd.shop";
  
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
            
            // Search database for a matching custom domain
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

  // 4. Internal Rewrite
  if (username && username !== 'www') {
    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/sitemap.xml',
    '/robots.txt',
    '/manifest.json',
    '/sw.js'
  ],
};

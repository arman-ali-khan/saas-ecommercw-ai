
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Supports Subdomains (store.dokanbd.shop and store.e-bd.shop) and Custom Domains.
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

  // Normalize host: lowercase and remove port if present
  const host = hostname.split(':')[0].toLowerCase();
  
  // 2. Identify Platform Root Domains
  const platformRootDomains = [
    'dokanbd.shop',
    'e-bd.shop',
    'localhost',
  ];

  // Check if current host is a root platform domain or development environment
  const isPlatformRoot = platformRootDomains.some(d => host === d || host === `www.${d}`) ||
                         host.endsWith('.vercel.app') || 
                         host.includes('cloudworkstations.dev') ||
                         host.includes('cluster-aic6jbiihrhmyrqafasatvzbwe'); 
  
  if (isPlatformRoot) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve Store Username from Subdomains
  if (host.endsWith('.dokanbd.shop')) {
    username = host.replace('.dokanbd.shop', '').replace(/^www\./, '');
  } 
  else if (host.endsWith('.e-bd.shop')) {
    username = host.replace('.e-bd.shop', '').replace(/^www\./, '');
  }
  
  // 4. Fallback: Resolve Store Username from Custom Domains via Database
  if (!username) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const hostWithoutWww = host.replace(/^www\./, '');
            
            // Query for custom domain matches (Check both www and non-www versions)
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
        console.error('Middleware Custom Domain Resolution Error:', e);
    }
  }
  
  // Clean up resolved username
  if (username) {
    username = username.trim();
  }

  // 5. Internal Rewrite to Tenant Path [username]
  if (username && username !== 'www' && username !== '') {
    // Prevent recursive rewrites if the path already starts with the tenant slug
    if (url.pathname.startsWith(`/${username}/`) || url.pathname === `/${username}`) {
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

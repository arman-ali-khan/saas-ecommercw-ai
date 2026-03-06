
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
  
  // 2. Define Root Domains (Platform Landing Pages)
  const rootDomains = [
    'dokanbd.shop',
    'www.dokanbd.shop',
    'e-bd.shop',
    'www.e-bd.shop',
    'localhost',
  ];

  // Check if current host is a root platform domain
  const isRoot = rootDomains.includes(host) || 
                 host.endsWith('.vercel.app') || 
                 host.includes('cloudworkstations.dev') ||
                 host.includes('cluster-aic6jbiihrhmyrqafasatvzbwe'); 
  
  if (isRoot) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve Store Username (Slug)
  
  // Case A: Subdomain resolution for primary domain
  if (host.endsWith('.dokanbd.shop')) {
    username = host.replace('.dokanbd.shop', '');
  } 
  // Case B: Subdomain resolution for new addon domain
  else if (host.endsWith('.e-bd.shop')) {
    username = host.replace('.e-bd.shop', '');
  }
  // Case C: Custom Domain resolution
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
  
  // Clean up username (remove www. if present in subdomain)
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

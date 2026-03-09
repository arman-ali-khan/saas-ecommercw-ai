
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel-Optimized Middleware for Multi-tenant Store Resolution.
 * Supports Subdomains (*.dokanbd.shop and *.e-bd.shop) and Custom Domains.
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
  // Check for e-bd.shop subdomains
  if (host.endsWith('.e-bd.shop')) {
    const parts = host.replace('.e-bd.shop', '').split('.');
    username = parts[parts.length - 1];
  } 
  // Check for dokanbd.shop subdomains
  else if (host.endsWith('.dokanbd.shop')) {
    const parts = host.replace('.dokanbd.shop', '').split('.');
    username = parts[parts.length - 1];
  }
  
  // Clean up if username is platform-reserved
  if (['www', 'api', 'admin', 'dashboard', 'profile'].includes(username)) {
      return NextResponse.next();
  }

  // 4. Fallback: Resolve Store Username from Custom Domains via Database
  if (!username) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const hostWithoutWww = host.replace(/^www\./, '');
            
            // Query for custom domain matches
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
        console.error('Middleware Domain Resolution Error:', e);
    }
  }
  
  // 5. Internal Rewrite to Tenant Path [username]
  if (username) {
    // Prevent double rewrites or recursion
    if (url.pathname.startsWith(`/${username}/`) || url.pathname === `/${username}`) {
        return NextResponse.next();
    }

    const targetPath = `/${username}${url.pathname}${url.search || ''}`;
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

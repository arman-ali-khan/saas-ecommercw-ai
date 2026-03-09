
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel-Optimized Middleware for Multi-tenant Store Resolution.
 * Priority: 1. System Paths, 2. Root Domains, 3. Custom Domain Lookup, 4. Subdomain parsing.
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
    url.pathname === '/sitemap.xml' ||
    url.pathname.startsWith('/admin') || // Block root admin paths
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/profile')
  ) {
    return NextResponse.next();
  }

  // Normalize host: lowercase and remove port if present
  const host = hostname.split(':')[0].toLowerCase();
  const hostWithoutWww = host.replace(/^www\./, '');
  
  // 2. Identify Platform Root Domains
  const platformRootDomains = [
    'dokanbd.shop',
    'e-bd.shop',
    'localhost',
  ];

  const isPlatformRoot = platformRootDomains.some(d => host === d || host === `www.${d}`) ||
                         host.endsWith('.vercel.app') || 
                         host.includes('cloudworkstations.dev') ||
                         host.includes('cluster-aic6jbiihrhmyrqafasatvzbwe'); 
  
  // If it's the root platform domain but not a subdomain, let it pass
  if (isPlatformRoot && !platformRootDomains.some(d => hostWithoutWww.endsWith(`.${d}`))) {
      return NextResponse.next();
  }

  let username = '';

  // 3. PRIORITIZE: Check Database for Custom Domain
  // If the host is NOT one of the base platform domains directly, it might be a custom domain
  if (!platformRootDomains.some(d => hostWithoutWww.endsWith(d))) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Check for exact match or non-www match
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

  // 4. FALLBACK: Resolve from Subdomains if not resolved via Custom Domain
  if (!username) {
    const rootMatch = platformRootDomains.find(d => host.endsWith(`.${d}`));
    if (rootMatch) {
        const subdomainPart = host.replace(`.${rootMatch}`, '').replace(/^www\./, '');
        if (subdomainPart && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomainPart)) {
            username = subdomainPart;
        }
    }
  }
  
  // 5. Final check and Internal Rewrite
  if (username) {
      // Prevent recursion if already rewritten
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

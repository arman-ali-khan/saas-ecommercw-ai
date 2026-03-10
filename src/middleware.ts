
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel-Optimized Middleware for Multi-tenant Store Resolution.
 * Handles Root, Subdomains, and Custom Domains.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. Skip core internal paths and static assets (except store-specific config files)
  const isStaticFile = url.pathname.includes('.') && 
                       !['/manifest.json', '/robots.txt', '/sitemap.xml', '/sw.js'].includes(url.pathname);

  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    isStaticFile ||
    url.pathname.startsWith('/dashboard')
  ) {
    return NextResponse.next();
  }

  // Normalize host: lowercase and remove port
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
  
  // If it's exactly the root platform domain (not a subdomain), don't rewrite
  if (isPlatformRoot && !platformRootDomains.some(d => hostWithoutWww.endsWith(`.${d}`))) {
      return NextResponse.next();
  }

  let username = '';

  // 3. PRIORITIZE: Check Database for Custom Domain
  const isBaseSubdomain = platformRootDomains.some(d => hostWithoutWww.endsWith(`.${d}`));
  
  if (!isBaseSubdomain && !isPlatformRoot) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Check for exact match in custom_domain column
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

  // 4. FALLBACK: Resolve from Subdomains
  if (!username) {
    const rootMatch = platformRootDomains.find(d => host.endsWith(`.${d}`));
    if (rootMatch) {
        const subdomainPart = host.replace(`.${rootMatch}`, '').replace(/^www\./, '');
        // Exclude reserved system subdomains
        if (subdomainPart && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomainPart)) {
            username = subdomainPart;
        }
    }
  }
  
  // 5. Perform Internal Rewrite to the dynamic [username] folder
  if (username) {
      // Prevent recursion
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
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/sw.js'
  ],
};

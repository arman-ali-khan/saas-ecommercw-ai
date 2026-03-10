
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Middleware for Multi-tenant Store Resolution.
 * - Prioritizes subdomains of e-bd.shop.
 * - Supports custom domains mapped in the profiles table.
 * - Integrated with NEXT_PUBLIC_BASE_DOMAIN environment variable.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Clean hostname (remove port if any and convert to lowercase)
  const host = hostname.split(':')[0].toLowerCase();
  
  // Get base domain from env (e.g. e-bd.shop)
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'e-bd.shop').toLowerCase().trim();
  
  // 1. Skip core internal paths, common static assets and API
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    url.pathname.startsWith('/dashboard') ||
    (url.pathname.includes('.') && !['/manifest.json', '/robots.txt', '/sitemap.xml', '/sw.js'].includes(url.pathname))
  ) {
    return NextResponse.next();
  }

  // 2. Identify Platform Root (e.g., e-bd.shop or www.e-bd.shop)
  const platformRootDomains = [baseDomain, `www.${baseDomain}`, 'localhost', 'www.localhost'];
  
  // Check if we are on the main platform landing pages
  if (platformRootDomains.includes(host) || host.includes('cloudworkstations.dev')) {
      // If it's specifically one of our root domains, it's definitely the landing page
      if (host === baseDomain || host === `www.${baseDomain}` || host === 'localhost' || host === 'www.localhost') {
          return NextResponse.next();
      }
      
      // Fallback: If host doesn't contain baseDomain at all, treat as landing/development root
      if (!host.includes(baseDomain) && !host.includes('localhost')) {
          return NextResponse.next();
      }
  }

  let storeUsername = '';

  // 3. STEP 1: CHECK SUBDOMAIN (e.g., sam.e-bd.shop)
  // Highest priority for wildcard setup on Vercel
  if (host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
      if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
          storeUsername = subdomain;
      }
  }

  // 4. STEP 2: CHECK CUSTOM DOMAIN (If not a subdomain match)
  if (!storeUsername) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const cleanHost = host.replace(/^www\./, '');
        
        // Query profiles for custom_domain match OR SAM.COM style Sam identifier
        const { data: profile } = await supabase
          .from('profiles')
          .select('domain')
          .or(`custom_domain.eq."${host}",custom_domain.eq."${cleanHost}",domain.eq."${cleanHost}"`)
          .maybeSingle();
        
        if (profile?.domain) {
          storeUsername = profile.domain;
        }
      }
    } catch (e) {
      console.error('Middleware Resolution Error:', e);
    }
  }

  // 5. STEP 3: LOCALHOST FALLBACK (e.g. sam.localhost:3000)
  if (!storeUsername && host.includes('localhost')) {
      const parts = host.split('.');
      if (parts.length > 1) {
          const subdomain = parts[0];
          if (subdomain !== 'www' && subdomain !== 'localhost') {
              storeUsername = subdomain;
          }
      }
  }
  
  // 6. Rewrite to the internal [username] folder
  if (storeUsername) {
    // If path already starts with the username (e.g. internal nav), avoid double prefix
    if (url.pathname.startsWith(`/${storeUsername}/`) || url.pathname === `/${storeUsername}`) {
      return NextResponse.next();
    }
    
    const targetPath = `/${storeUsername}${url.pathname}${url.search || ''}`;
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

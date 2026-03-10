
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Robust Middleware for Multi-tenant Store Resolution.
 * - Prioritizes custom_domain from profiles table.
 * - Fallback to subdomain style based on NEXT_PUBLIC_BASE_DOMAIN.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0].toLowerCase();
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'e-bd.shop';
  
  // 1. Skip core internal paths and common static assets
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

  // 2. Identify Platform Root (e.g., e-bd.shop or localhost)
  const platformRootDomains = [baseDomain, 'localhost'];
  const isPlatformRoot = platformRootDomains.some(d => host === d || host === `www.${d}`);
  
  if (isPlatformRoot) {
      return NextResponse.next();
  }

  let storeUsername = '';

  // 3. STEP 1: CHECK CUSTOM DOMAIN (Highest Priority)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const cleanHost = host.replace(/^www\./, '');
      
      // Query profiles for custom_domain match
      const { data: profile } = await supabase
        .from('profiles')
        .select('domain')
        .or(`custom_domain.eq."${host}",custom_domain.eq."${cleanHost}"`)
        .maybeSingle();
      
      if (profile?.domain) {
        storeUsername = profile.domain;
      }
    }
  } catch (e) {
    console.error('Middleware Custom Domain Resolution Error:', e);
  }

  // 4. STEP 2: CHECK SUBDOMAIN (Fallback if not a custom domain)
  if (!storeUsername) {
    if (host.endsWith(`.${baseDomain}`)) {
        const subdomain = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
        if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
            storeUsername = subdomain;
        }
    } else if (host.includes('localhost') && host.split('.').length > 1) {
        const subdomain = host.split('.')[0];
        if (subdomain !== 'www' && subdomain !== 'localhost') {
            storeUsername = subdomain;
        }
    }
  }
  
  // 5. Rewrite to the internal [username] folder
  if (storeUsername) {
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

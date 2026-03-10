
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * - Prioritizes e-bd.shop subdomains and custom domains.
 * - Includes robust environment variable cleaning.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Clean hostname (remove port and convert to lowercase)
  const host = hostname.split(':')[0].toLowerCase();
  
  // Robust base domain cleaning (removes https://, www., and trailing slashes)
  const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'e-bd.shop')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase()
    .trim();
  
  // 1. Skip core internal paths and static assets
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

  // 2. Identify if we are on the platform root (e-bd.shop, www.e-bd.shop, localhost)
  const isPlatformRoot = 
    host === baseDomain || 
    host === `www.${baseDomain}` || 
    host === 'localhost' || 
    host.includes('cloudworkstations.dev') ||
    (host.endsWith('.vercel.app') && !host.includes(baseDomain));

  if (isPlatformRoot && !host.endsWith(`.${baseDomain}`)) {
    return NextResponse.next();
  }

  let storeUsername = '';

  // 3. Resolve Store Username
  
  // A. Check for e-bd.shop subdomain (e.g. sam.e-bd.shop)
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
    if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
      storeUsername = subdomain;
    }
  }

  // B. Check for Custom Domain if not a subdomain
  if (!storeUsername) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const cleanHost = host.replace(/^www\./, '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('domain')
          .or(`custom_domain.eq.${host},custom_domain.eq.${cleanHost},domain.eq.${cleanHost}`)
          .maybeSingle();
        
        if (profile?.domain) {
          storeUsername = profile.domain;
        }
      }
    } catch (e) {
      console.error('Middleware DB Error:', e);
    }
  }

  // C. Localhost testing fallback (e.g. sam.localhost:3000)
  if (!storeUsername && host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1) {
      const sub = parts[0];
      if (sub !== 'www' && sub !== 'localhost') storeUsername = sub;
    }
  }
  
  // 4. Perform Rewrite
  if (storeUsername) {
    // Avoid double prefixing
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

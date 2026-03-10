
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Prioritizes custom_domain from profiles table, then falls back to subdomain.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0].toLowerCase();
  
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

  const platformRootDomains = [
    'dokanbd.shop',
    'e-bd.shop',
    'localhost',
  ];

  // 2. Identify if it's a Platform Root (e.g., dokanbd.shop or e-bd.shop)
  const isPlatformRoot = platformRootDomains.some(d => host === d || host === `www.${d}`);
  
  if (isPlatformRoot) {
      return NextResponse.next();
  }

  let storeUsername = '';

  // 3. CHECK CUSTOM DOMAIN FIRST (Search profiles table)
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
        .or(`custom_domain.eq.${host},custom_domain.eq.${cleanHost}`)
        .maybeSingle();
      
      if (profile?.domain) {
        storeUsername = profile.domain;
      }
    }
  } catch (e) {
    console.error('Middleware Custom Domain Resolution Error:', e);
  }

  // 4. FALLBACK TO SUBDOMAIN (if not a custom domain match)
  if (!storeUsername) {
    const rootMatch = platformRootDomains.find(d => host.endsWith(`.${d}`));
    
    if (rootMatch) {
      // Extract the subdomain (handle www. correctly)
      const subdomain = host.replace(`.${rootMatch}`, '').replace(/^www\./, '');
      
      // Check if it's a valid store subdomain (not a system reserved one)
      if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
        storeUsername = subdomain;
      }
    } 
  }
  
  // 5. Perform Internal Rewrite to the dynamic [username] folder
  if (storeUsername) {
    // Avoid double rewrite if the URL already has the rewritten path
    if (url.pathname.startsWith(`/${storeUsername}/`) || url.pathname === `/${storeUsername}`) {
      return NextResponse.next();
    }
    
    // Target path is inside the dynamic [username] route
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

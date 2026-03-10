
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution (Subdomains & Custom Domains).
 * Supports dokanbd.shop, e-bd.shop and external custom domains.
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

  let username = '';

  // 2. Identify if it's a Subdomain of a Platform Root (e.g., sam.e-bd.shop)
  const rootDomainMatch = platformRootDomains.find(d => host.endsWith(`.${d}`));
  
  if (rootDomainMatch) {
    // Extract the subdomain (handle www. correctly)
    const subdomain = host.replace(`.${rootDomainMatch}`, '').replace(/^www\./, '');
    
    // Check if it's a valid store subdomain (not a system reserved one)
    if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
      username = subdomain;
    }
  } 
  
  // 3. If not a platform subdomain, check if it's a Custom Domain (e.g., mybrand.com)
  if (!username && !platformRootDomains.some(d => host === d || host === `www.${d}`)) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const hostWithoutWww = host.replace(/^www\./, '');
        
        // Search for this domain in profiles table
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
  
  // 4. Perform Internal Rewrite to the dynamic [username] folder
  if (username) {
    // Avoid double rewrite if the URL already has the rewritten path
    if (url.pathname.startsWith(`/${username}/`) || url.pathname === `/${username}`) {
      return NextResponse.next();
    }
    
    // Target path is inside the dynamic [username] route
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

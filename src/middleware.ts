
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vercel-Optimized Middleware for Multi-tenant Store Resolution.
 * Handles Root, Subdomains (dokanbd.shop, e-bd.shop), and Custom Domains.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0].toLowerCase();
  
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

  const platformRootDomains = [
    'dokanbd.shop',
    'e-bd.shop',
    'localhost',
  ];

  // 2. Identify if it's a Platform Root Domain (no subdomain)
  const isPlatformRoot = platformRootDomains.some(d => host === d || host === `www.${d}`) ||
                         host.endsWith('.vercel.app') || 
                         host.includes('cloudworkstations.dev') ||
                         host.includes('cluster-aic6jbiihrhmyrqafasatvzbwe'); 
  
  let username = '';

  // 3. If it's not the root platform, resolve the store
  if (!isPlatformRoot) {
    // A. Check for Subdomain (e.g., sam.e-bd.shop)
    const rootMatch = platformRootDomains.find(d => host.endsWith(`.${d}`));
    if (rootMatch) {
        // Extract the subdomain part (handle www correctly)
        const subdomainPart = host.replace(`.${rootMatch}`, '').replace(/^www\./, '');
        // Split by dots to handle nested subdomains and take the last part as username
        const parts = subdomainPart.split('.');
        const sub = parts[parts.length - 1];
        
        if (sub && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(sub)) {
            username = sub;
        }
    }

    // B. Fallback: Check Database for Custom Domain (e.g., myshop.com)
    if (!username) {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const hostWithoutWww = host.replace(/^www\./, '');
                
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
            console.error('Middleware Custom Domain Error:', e);
        }
    }
  }
  
  // 4. Perform Internal Rewrite to the dynamic [username] folder
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
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/sw.js'
  ],
};

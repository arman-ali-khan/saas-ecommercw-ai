
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Middleware for Multi-tenant Store Resolution.
 * Optimized for Vercel wildcard subdomains and custom domains.
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Clean hostname (remove port and convert to lowercase)
  const host = hostname.split(':')[0].toLowerCase();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ihut.shop').toLowerCase().trim();
  let previewDomain = '';

  // 1. Fetch Dynamic Configuration (base_domain, preview_domain)
  if (supabaseUrl && supabaseKey) {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: settings } = await supabase.from('saas_settings').select('base_domain, preview_domain').eq('id', 1).maybeSingle();
        if (settings?.base_domain) baseDomain = settings.base_domain.toLowerCase().trim();
        if (settings?.preview_domain) previewDomain = settings.preview_domain.toLowerCase().trim();
    } catch (e) { console.error('Middleware Config Fetch Error:', e); }
  }
  
  // 2. Skip internal paths and assets
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

  // 3. Platform Root Identification
  const platformRootDomains = [
    baseDomain,
    `www.${baseDomain}`,
    'dokan-bd.vercel.app',
    'localhost',
    'dokanbd.shop',
    'www.dokanbd.shop'
  ];
  if (previewDomain) {
      platformRootDomains.push(previewDomain);
      platformRootDomains.push(`www.${previewDomain}`);
  }

  const isPlatformRoot = platformRootDomains.includes(host) || host.includes('cloudworkstations.dev');

  // If it's the platform root, don't rewrite (just handle standard routing)
  if (isPlatformRoot && !host.endsWith(`.${baseDomain}`) && (!previewDomain || !host.endsWith(`.${previewDomain}`))) {
    return NextResponse.next();
  }

  let storeUsername = '';

  // 4. Subdomain Resolution (Base Domain)
  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
    if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
      storeUsername = subdomain;
    }
  }

  // 5. Subdomain Resolution (Preview Domain)
  if (!storeUsername && previewDomain && host.endsWith(`.${previewDomain}`)) {
    const subdomain = host.replace(`.${previewDomain}`, '').replace(/^www\./, '');
    if (subdomain && !['www', 'api', 'admin', 'dashboard', 'profile'].includes(subdomain)) {
      storeUsername = subdomain;
    }
  }

  // 6. Custom Domain Resolution (e.g., schoolbd.top)
  if (!storeUsername && supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const cleanHost = host.replace(/^www\./, '');
      
      // Search in profiles table for custom_domain match
      const { data: profile } = await supabase
        .from('profiles')
        .select('domain')
        .or(`custom_domain.eq.${host},custom_domain.eq.${cleanHost}`)
        .maybeSingle();
      
      if (profile?.domain) {
        storeUsername = profile.domain;
      }
    } catch (e) {
      console.error('Middleware DB Error:', e);
    }
  }
  
  // 7. Perform Rewrite to Tenant Path
  if (storeUsername) {
    // Prevent double prefixing
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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. Skip system files and API routes
  const globalSystemFiles = ['/favicon.ico', '/sw.js', '/manifest.json', '/robots.txt', '/sitemap.xml', '/logo.png'];
  
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/_next') || 
    url.pathname.startsWith('/_static') ||
    url.pathname.startsWith('/_vercel') ||
    globalSystemFiles.includes(url.pathname)
  ) {
    return NextResponse.next();
  }

  // Get base domain from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  
  // Normalize host: split port and lowercase
  const host = hostname.split(':')[0].toLowerCase();
  const hostWithoutWww = host.replace(/^www\./, '');
  
  // 2. Check if this is the root domain (Platform Landing Page)
  // We check against the base domain and its www version, plus development/vercel previews
  const isRootDomain = 
    host === baseDomain || 
    host === `www.${baseDomain}` || 
    host.includes('vercel.app') || 
    host.includes('localhost') || 
    host.includes('workstation');
  
  if (isRootDomain) {
      return NextResponse.next();
  }

  let username = '';

  // 3. Resolve username (Store Slug)
  
  // Case A: Subdomain resolution (e.g., store1.schoolbd.top)
  if (host.endsWith(`.${baseDomain}`)) {
    // Extract subdomain name (e.g., 'store1')
    username = host.replace(`.${baseDomain}`, '').replace(/^www\./, '');
  } 
  // Case B: Custom Domain resolution (e.g., dokanbd.shop or www.dokanbd.shop)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Search database for a profile where custom_domain matches the current host.
            // We check both the naked domain and the provided host to handle 'www.' inconsistencies.
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('domain')
                .or(`custom_domain.eq.${host},custom_domain.eq.${hostWithoutWww}`)
                .maybeSingle();
            
            if (profile?.domain && !error) {
                username = profile.domain;
            }
        }
    } catch (e) {
        console.error('Custom domain resolution error:', e);
    }
  }

  // 4. Internal Rewrite
  // If we resolved a username and it's not 'www', rewrite the request internally to the dynamic route path
  if (username && username !== 'www') {
    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // Fallback to next (shows landing page or results in 404 if username not found)
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

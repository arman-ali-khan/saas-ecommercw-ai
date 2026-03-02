import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. SKIP REWRITES FOR SYSTEM PATHS, STATIC ASSETS AND API
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

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
  
  // Clean hostname (strip port and handle www prefix)
  const curHost = hostname.replace('www.', '').split(':')[0].toLowerCase();
  
  // Check if it's the root SaaS domain or a local/dev environment
  const isRoot = curHost === rootDomain || curHost.includes('vercel.app') || curHost.includes('localhost') || curHost.includes('workstation');

  // If it's exactly the root domain, serve the platform landing page
  if (curHost === rootDomain) {
      return NextResponse.next();
  }

  let username = '';

  // 2. RESOLVE USERNAME (SLUG)
  
  // Case A: Subdomain of our root (e.g., store1.schoolbd.top)
  if (curHost.endsWith(`.${rootDomain}`)) {
    username = curHost.replace(`.${rootDomain}`, '');
  } 
  // Case B: Parked Custom Domain (e.g., mybrand.com)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Search for store by its assigned custom_domain
            const { data, error } = await supabase
                .from('profiles')
                .select('domain')
                .eq('custom_domain', curHost)
                .maybeSingle();
            
            if (data?.domain && !error) {
                username = data.domain;
            }
        }
    } catch (e) {
        console.error('Custom domain resolution error:', e);
    }
  }

  // 3. REWRITE TO DYNAMIC ROUTE /[username]/...
  // If we resolved a valid username, we rewrite the URL internally.
  // The browser URL remains mybrand.com, but Next.js sees /[username]/...
  if (username && username !== 'www') {
    const targetPath = `/${username}${url.pathname}${url.search}`;
    return NextResponse.rewrite(new URL(targetPath, request.url));
  }

  // Fallback to landing page if no store is matched
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

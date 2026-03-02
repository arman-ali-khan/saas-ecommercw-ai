import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. SKIP REWRITES FOR SYSTEM PATHS AND STATIC ASSETS
  const globalSystemFiles = ['/favicon.ico', '/firebase-messaging-sw.js', '/sw.js', '/manifest.json', '/logo.png'];
  
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
  
  // Clean hostname (remove port and handle www prefix)
  const hostWithoutPort = hostname.split(':')[0];
  const curHost = hostWithoutPort.replace('www.', '');
  
  // Check if it's the root SaaS domain
  const isRoot = curHost === rootDomain || hostWithoutPort.includes('workstation');

  if (isRoot && !curHost.includes('.')) {
    return NextResponse.next();
  }
  
  if (curHost === rootDomain) {
      return NextResponse.next();
  }

  // 2. Resolve Username (Slug)
  let username = '';

  // Case A: Check if it's a subdomain of our root domain (e.g., user.schoolbd.top)
  if (curHost.endsWith(`.${rootDomain}`)) {
    username = curHost.replace(`.${rootDomain}`, '');
  } 
  // Case B: It's likely a custom domain (e.g., mybrand.com)
  else {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Search for store by custom_domain or matching domain slug
            const { data, error } = await supabase
                .from('profiles')
                .select('domain')
                .or(`custom_domain.eq.${curHost},domain.eq.${curHost}`)
                .maybeSingle();
            
            if (data && !error) {
                username = data.domain;
            }
        }
    } catch (e) {
        console.error('Custom domain resolution error:', e);
    }
  }

  // If no username is resolved, serve the standard platform landing page
  if (!username || username === 'www') {
    return NextResponse.next();
  }

  // 3. Rewrite to dynamic route /[username]/...
  const targetPath = `/${username}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
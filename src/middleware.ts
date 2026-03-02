
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
 
  // 1. SKIP REWRITES FOR SYSTEM PATHS AND STATIC ASSETS
  const globalSystemFiles = ['/favicon.ico', '/firebase-messaging-sw.js', '/sw.js', '/manifest.json'];
  
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
  
  // Detect if we are on a development environment or local host
  const isDevHost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1' || hostWithoutPort.includes('workstation');
  
  // Check if it's the root SaaS domain
  const isRoot = curHost === rootDomain;

  if (isRoot) {
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
            
            // Lookup the 'profiles' table to find the store slug mapped to this custom domain
            // We use maybeSingle() to avoid throwing errors if no match is found
            const { data, error } = await supabase
                .from('profiles')
                .select('domain')
                .or(`custom_domain.eq.${curHost},custom_domain.eq.${hostWithoutPort}`)
                .maybeSingle();
            
            if (data && !error) {
                username = data.domain;
            }
        }
    } catch (e) {
        console.error('Custom domain resolution error in middleware:', e);
    }
  }

  // If no username/store-slug is resolved, serve the standard platform landing page
  if (!username || username === 'www') {
    if (isDevHost) return NextResponse.next();
    return NextResponse.next();
  }

  // 3. Rewrite to dynamic route /[username]/...
  // This tells Next.js to treat the request as if it was for the dynamic [username] folder
  const targetPath = `/${username}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(targetPath, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

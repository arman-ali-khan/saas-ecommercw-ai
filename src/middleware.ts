
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
  
  // Clean hostname (remove port and www prefix for easier matching)
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
  // Case B: It's likely a custom domain (e.g., userdomain.com)
  else {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // We look up the 'profiles' table to find which internal domain (slug) 
        // is mapped to this external custom domain.
        // We check both with and without 'www.' for maximum compatibility.
        const { data } = await supabase
            .from('profiles')
            .select('domain')
            .or(`custom_domain.eq.${curHost},custom_domain.eq.${hostWithoutPort}`)
            .single();
        
        if (data) {
            username = data.domain;
        }
    } catch (e) {
        console.error('Custom domain lookup error:', e);
    }
  }

  // If no username/store-slug is resolved, serve the standard platform landing page
  if (!username || username === 'www') {
    // If it's a dev host and not matching anything, just continue to root
    if (isDevHost) return NextResponse.next();
    
    // In production, we could redirect to root or show 404, 
    // for now we let it fall through to root.
    return NextResponse.next();
  }

  // 3. Rewrite to dynamic route /[username]/...
  // This effectively tells Next.js: "Treat this request as if it was for /username/path"
  // This allows the App Router to use the files in src/app/[username]/...
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

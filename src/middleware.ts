import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// This helper function handles the Supabase session logic.
// It takes a request and a response and adds the necessary auth cookies to the response.
async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // This will refresh the session if expired.
  await supabase.auth.getSession();

  return response;
}


export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');
  
  // Define your root domain. Using an env var is best practice.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schoolbd.top";

  const searchPart = `.${rootDomain}`;
  const subdomain = 
    hostname && hostname.endsWith(searchPart)
    ? hostname.replace(searchPart, "") 
    : null;

  // Default response is to continue to the next middleware or route handler.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If we are on a valid subdomain (and not 'www'), rewrite the URL.
  if (subdomain && subdomain !== 'www') {
    url.pathname = `/${subdomain}${url.pathname}`;
    response = NextResponse.rewrite(url);
  }
  
  // Finally, pass the determined response (either next() or rewrite()) 
  // to the Supabase session handler to attach the auth cookies.
  return await updateSupabaseSession(request, response);
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api (API routes)
     * 2. /_next (standard Next.js assets)
     * 3. /static (public files like images)
     * 4. All files with extensions (e.g., favicon.ico, logo.png)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};


import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {}
        },
      },
    }
  )

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Now create an admin client to fetch the profile, bypassing RLS
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    )

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('API get-profile error:', { message: error.message, code: error.code, details: error.details });
      return NextResponse.json({ error: 'Profile not found or database error' }, { status: 404 });
    }
    
    // --- SECURITY FIX ---
    // Validate that the request domain matches the user's role and domain.
    const hostname = request.headers.get('host');
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
    const isMainDomain = (hostname === rootDomain || hostname === `www.${rootDomain}`);
    const requestSubdomain = isMainDomain ? null : hostname?.split('.')[0];
    
    // If it's a saas_admin, they MUST be on the main domain
    if (profile.role === 'saas_admin') {
        if (!isMainDomain) {
            return NextResponse.json({ error: 'Access denied: SaaS admin cannot access subdomain APIs.' }, { status: 403 });
        }
    } 
    // If it's a regular admin, they MUST be on their subdomain
    else if (profile.role === 'admin') {
        if (isMainDomain || profile.domain !== requestSubdomain) {
             return NextResponse.json({ error: 'Access denied: Admin domain mismatch.' }, { status: 403 });
        }
    } 
    // If it's some other role (like customer) trying to use this endpoint, deny.
    else {
        return NextResponse.json({ error: 'Access denied: Invalid role for this endpoint.' }, { status: 403 });
    }
    // --- END SECURITY FIX ---

    return NextResponse.json({ profile });

  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}

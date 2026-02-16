
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

    // --- SECURITY FIX ---
    // 1. Get request domain info
    const hostname = request.headers.get('host');
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
    const requestSubdomain = hostname?.split('.')[0];
    
    if (!requestSubdomain || hostname === rootDomain || hostname === `www.${rootDomain}`) {
         return NextResponse.json({ error: 'Invalid customer domain' }, { status: 400 });
    }
    
    // 2. Get the site_id for the request's domain
    const { data: siteProfile, error: siteError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('domain', requestSubdomain)
        .single();
        
    if (siteError || !siteProfile) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    const siteId = siteProfile.id;
    // --- END SECURITY FIX ---


    const { data: customerProfile, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('id', session.user.id)
      .eq('site_id', siteId) // Only fetch if customer belongs to the site being accessed
      .single();

    if (error) {
      return NextResponse.json({ error: 'Customer profile not found for this site.' }, { status: 404 });
    }

    return NextResponse.json({ customerProfile });

  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}


import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decryptObject } from '@/lib/encryption';

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
    
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    )

    // Fetch profile along with settings and plan details in one query
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        store_settings(language, logo_type, logo_icon, logo_image_url),
        plans(product_limit, customer_limit, order_limit)
      `)
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('API get-profile error:', { message: error.message, code: error.code, details: error.details });
      return NextResponse.json({ error: 'Profile not found or database error' }, { status: 404 });
    }
    
    // Decrypt sensitive fields using recursive decryption
    const decryptedProfile = decryptObject(profile);
    
    const hostname = request.headers.get('host') || '';
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
    const isMainDomain = (hostname === rootDomain || hostname === `www.${rootDomain}`);
    const requestSubdomain = isMainDomain ? null : hostname.split('.')[0];
    
    // Authorization checks
    if (decryptedProfile.role === 'saas_admin') {
        if (!isMainDomain) {
            return NextResponse.json({ error: 'Access denied: SaaS admin cannot access subdomain APIs.' }, { status: 403 });
        }
    } 
    else if (decryptedProfile.role === 'admin') {
        if (isMainDomain || (requestSubdomain && decryptedProfile.domain !== requestSubdomain)) {
             // In local dev, subdomain might not be easily parsed from host, so we allow it if localhost
             if (!hostname.includes('localhost') && !hostname.includes('cloudworkstations.dev')) {
                return NextResponse.json({ error: 'Access denied: Admin domain mismatch.' }, { status: 403 });
             }
        }
    } 

    return NextResponse.json({ profile: decryptedProfile });

  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}

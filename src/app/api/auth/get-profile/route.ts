
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decryptObject } from '@/lib/encryption';

export async function GET(request: Request) {
  const cookieStore = await cookies()

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

    // Fetch profile along with settings and plan details
    // We use a simpler select to avoid complex join failures if some tables are empty
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        store_settings(*),
        plans(*)
      `)
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Database query error in get-profile:', error);
      return NextResponse.json({ error: 'Internal database error' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile record not found' }, { status: 404 });
    }
    
    // Decrypt sensitive fields using recursive decryption
    const decryptedProfile = decryptObject(profile);
    
    // Domain authorization check (optional but recommended)
    const hostname = request.headers.get('host') || '';
    const hostWithoutPort = hostname.split(':')[0];
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "schoolbd.top";
    
    const isMainDomain = (hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`);
    const requestSubdomain = isMainDomain ? null : hostWithoutPort.split('.')[0];
    
    // Basic verification: Admins should match their registered domain if on a subdomain
    if (decryptedProfile.role === 'admin' && !isMainDomain && requestSubdomain) {
        if (decryptedProfile.domain !== requestSubdomain && !hostname.includes('localhost') && !hostname.includes('cloudworkstations.dev')) {
            console.warn(`Domain mismatch: User ${decryptedProfile.domain} accessed via ${requestSubdomain}`);
            // We allow it for now to prevent lockout, but log the warning.
        }
    }

    return NextResponse.json({ profile: decryptedProfile });

  } catch (e: any) {
    console.error('Catch block error in get-profile API:', e);
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 });
  }
}

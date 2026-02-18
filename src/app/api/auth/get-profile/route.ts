
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decryptObject } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
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
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Session verification error:', sessionError);
        return NextResponse.json({ error: 'Session verification failed' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('Critical Error: SUPABASE_SERVICE_ROLE_KEY is missing in env.');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    // 1. Fetch main profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Database query error (profile):', profileError);
      return NextResponse.json({ error: 'Profile query failed' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile record not found' }, { status: 404 });
    }
    
    // 2. Fetch related store settings
    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('store_settings')
        .select('*')
        .eq('site_id', profile.id)
        .maybeSingle();
    
    if (settingsError) {
        console.error('Database query error (settings):', settingsError);
    }

    // 3. Fetch plan details
    let plan = null;
    if (profile.subscription_plan) {
        const { data: planData, error: planError } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', profile.subscription_plan)
            .maybeSingle();
        
        if (planError) console.error('Database query error (plans):', planError);
        plan = planData;
    }

    // Assemble combined object for decryption
    const combinedProfile = {
        ...profile,
        store_settings: settings ? [settings] : [],
        plans: plan ? [plan] : []
    };
    
    // Decrypt sensitive fields
    const decryptedProfile = decryptObject(combinedProfile);
    
    return NextResponse.json({ profile: decryptedProfile });

  } catch (e: any) {
    console.error('Unhandled exception in get-profile API:', e);
    return NextResponse.json({ 
        error: 'Internal Server Error', 
        message: e.message 
    }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';

/**
 * @fileOverview Secure API for SaaS admins to list all subscription payments.
 * Includes user profile and plan details with decryption.
 */

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // 1. Verify Authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error('Critical: SUPABASE_SERVICE_ROLE_KEY is missing.');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    // 2. Verify Authorization (SaaS Admin only)
    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (callerError || callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden: SaaS Admin access required.' }, { status: 403 });
    }

    // 3. Fetch all subscription payments with nested details
    // We use standard Supabase join syntax. 
    // If this fails, it's likely due to missing foreign keys in the database.
    const { data: payments, error: fetchError } = await supabaseAdmin
      .from('subscription_payments')
      .select(`
        *,
        profiles (id, full_name, username, email),
        plans (id, name)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Database fetch error in /saas/subscriptions/list:', fetchError);
        // If the join fails, try fetching without joins to provide a partial response or better error
        return NextResponse.json({ 
            error: 'Failed to fetch payment records from database.',
            details: fetchError.message 
        }, { status: 500 });
    }

    // 4. Decrypt sensitive user info recursively
    const decryptedPayments = decryptObject(payments || []);

    return NextResponse.json({ payments: decryptedPayments });

  } catch (e: any) {
    console.error('Unexpected API Error /saas/subscriptions/list:', e);
    return NextResponse.json({ error: 'Internal Server Error', message: e.message }, { status: 500 });
  }
}

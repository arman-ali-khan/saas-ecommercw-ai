
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';

/**
 * @fileOverview Secure API for SaaS admins to list all subscription payments.
 * Uses a manual join strategy to ensure reliability even if DB Foreign Keys are missing.
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

    // 3. Robust Data Fetching (Manual Join)
    // Step A: Get all payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsError) {
        console.error('Database fetch error (payments):', paymentsError);
        return NextResponse.json({ error: 'Failed to fetch payment records.' }, { status: 500 });
    }

    if (!payments || payments.length === 0) {
        return NextResponse.json({ payments: [] });
    }

    // Step B: Get unique User IDs and Plan IDs for related data
    const userIds = Array.from(new Set(payments.map(p => p.user_id).filter(Boolean)));
    const planIds = Array.from(new Set(payments.map(p => p.plan_id).filter(Boolean)));

    // Step C: Fetch Profiles and Plans in parallel
    const [profilesRes, plansRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, full_name, username, email').in('id', userIds),
        supabaseAdmin.from('plans').select('id, name').in('id', planIds)
    ]);

    const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const plansMap = new Map((plansRes.data || []).map(p => [p.id, p]));

    // Step D: Combine data
    const combinedPayments = payments.map(payment => ({
        ...payment,
        profiles: profilesMap.get(payment.user_id) || null,
        plans: plansMap.get(payment.plan_id) || null
    }));

    // 4. Decrypt sensitive user info recursively
    const decryptedPayments = decryptObject(combinedPayments);

    return NextResponse.json({ payments: decryptedPayments });

  } catch (e: any) {
    console.error('Unexpected API Error /saas/subscriptions/list:', e);
    return NextResponse.json({ error: 'Internal Server Error', message: e.message }, { status: 500 });
  }
}

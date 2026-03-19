
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Secure API for SaaS admins to list all subscription payments.
 * Optimized join logic and decryption.
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
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden: SaaS Admin access required.' }, { status: 403 });
    }

    // 3. Fetch Data - Use no-cache approach
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsError) throw paymentsError;

    if (!payments || payments.length === 0) {
        return NextResponse.json({ payments: [] }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
    }

    // 4. Manual Join for Related Data
    const userIds = Array.from(new Set(payments.map(p => p.user_id).filter(Boolean)));
    const planIds = Array.from(new Set(payments.map(p => p.plan_id).filter(Boolean)));

    const [profilesRes, plansRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, full_name, username, email, site_name').in('id', userIds),
        supabaseAdmin.from('plans').select('id, name').in('id', planIds)
    ]);

    // Decrypt profiles for display
    const decryptedProfiles = (profilesRes.data || []).map(p => decryptObject(p));
    const profilesMap = new Map(decryptedProfiles.map(p => [p.id, p]));
    const plansMap = new Map((plansRes.data || []).map(p => [p.id, p]));

    const combinedPayments = payments.map(payment => ({
        ...payment,
        profiles: profilesMap.get(payment.user_id) || null,
        plans: plansMap.get(payment.plan_id) || null
    }));

    return NextResponse.json({ payments: combinedPayments }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
    });

  } catch (e: any) {
    console.error('API /saas/subscriptions/list error:', e);
    return NextResponse.json({ error: 'Internal Server Error', message: e.message }, { status: 500 });
  }
}

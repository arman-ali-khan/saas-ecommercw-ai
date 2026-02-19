
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Verify caller is a SaaS Admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all subscription payments with user and plan details
    const { data: payments, error } = await supabaseAdmin
      .from('subscription_payments')
      .select('*, profiles(full_name, username, email), plans(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt sensitive user info
    const decryptedPayments = (payments || []).map(p => decryptObject(p));

    return NextResponse.json({ payments: decryptedPayments });

  } catch (e: any) {
    console.error('API /saas/subscriptions/list error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

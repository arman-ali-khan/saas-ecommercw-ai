
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

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
    );

    // Verify caller is a SaaS Admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch Stats and Recent Lists in Parallel
    const [
        profilesRes,
        paymentsRes,
        notificationsRes,
        pendingReviewsRes
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, subscription_status'),
        supabaseAdmin.from('subscription_payments').select('*, profiles(full_name, username, email), plans(name)').order('created_at', { ascending: false }),
        supabaseAdmin.from('notifications').select('*, profiles!notifications_recipient_id_fkey(full_name, username, email)').eq('is_read', false).eq('recipient_type', 'admin').order('created_at', { ascending: false }).limit(5),
        supabaseAdmin.from('saas_reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false)
    ]);

    if (paymentsRes.error) {
        console.error("Dashboard Payments Fetch Error:", paymentsRes.error);
    }

    const allProfiles = profilesRes.data || [];
    const allPayments = paymentsRes.data || [];
    const recentNotifications = notificationsRes.data || [];
    
    // Calculate Stats
    const totalRevenue = allPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const activeSubscriptions = allProfiles.filter(p => p.subscription_status === 'active').length;
    const pendingSubscriptionsCount = allPayments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length;

    // Decrypt everything recursively
    const processedPayments = decryptObject(allPayments.filter(p => p.status === 'pending' || p.status === 'pending_verification').slice(0, 5));
    const processedNotifications = decryptObject(recentNotifications);

    return NextResponse.json({
        stats: {
            totalRevenue,
            activeSubscriptions,
            pendingReviews: pendingReviewsRes.count || 0,
            pendingSubscriptions: pendingSubscriptionsCount,
        },
        recentPendingPayments: processedPayments,
        unreadNotifications: processedNotifications
    });

  } catch (e: any) {
    console.error('API /saas/dashboard-data error:', e);
    return NextResponse.json({ error: 'Internal Server Error', message: e.message }, { status: 500 });
  }
}

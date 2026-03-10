
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { decryptObject } from '@/lib/encryption';
import { subDays, format, isSameDay, startOfDay } from 'date-fns';

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

    const lastWeekDate = startOfDay(subDays(new Date(), 7));

    // Fetch Base Data in Parallel
    const [
        profilesRes,
        paymentsRes,
        notificationsRes,
        pendingReviewsRes,
        visitorsRes,
        plansRes
    ] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, subscription_status, full_name, username, email, site_name'),
        supabaseAdmin.from('subscription_payments').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('notifications')
            .select('*')
            .eq('is_read', false)
            .eq('recipient_type', 'admin')
            .is('recipient_id', null) 
            .order('created_at', { ascending: false })
            .limit(10),
        supabaseAdmin.from('saas_reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabaseAdmin.from('visitors').select('created_at').gte('created_at', lastWeekDate.toISOString()),
        supabaseAdmin.from('plans').select('id, name')
    ]);

    const allProfiles = profilesRes.data || [];
    const allPayments = paymentsRes.data || [];
    const allPlans = plansRes.data || [];
    const recentNotifications = notificationsRes.data || [];
    const weekVisitors = visitorsRes.data || [];
    
    // Maps for manual joining
    const profilesMap = new Map(allProfiles.map(p => [p.id, p]));
    const plansMap = new Map(allPlans.map(p => [p.id, p]));

    // 1. Total Revenue Calculation (Completed only)
    const totalRevenue = allPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

    // 2. Active Subscriptions Count
    const activeSubscriptions = allProfiles.filter(p => p.subscription_status === 'active').length;

    // 3. Pending Subscriptions Count
    const pendingPaymentsList = allPayments.filter(p => p.status === 'pending' || p.status === 'pending_verification');
    const pendingSubscriptionsCount = pendingPaymentsList.length;

    // --- Generate Weekly Trends ---
    const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
    
    const weeklyTrends = {
        revenue: days.map(day => {
            const amount = allPayments
                .filter(p => p.status === 'completed' && isSameDay(new Date(p.created_at), day))
                .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
            return { date: format(day, 'MMM d'), amount };
        }),
        visitors: days.map(day => {
            const count = weekVisitors.filter(v => isSameDay(new Date(v.created_at), day)).length;
            return { date: format(day, 'MMM d'), count };
        }),
        subscriptions: days.map(day => {
            const count = allPayments.filter(p => p.status === 'completed' && isSameDay(new Date(p.created_at), day)).length;
            return { date: format(day, 'MMM d'), count };
        })
    };

    // Prepare recent data with manual joins
    const recentPendingPaymentsJoined = pendingPaymentsList.slice(0, 5).map(p => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null,
        plans: plansMap.get(p.plan_id) || null
    }));

    const recentNotificationsJoined = recentNotifications.map(n => ({
        ...n,
        profiles: profilesMap.get(n.site_id) || null
    }));

    // Decrypt sensitive info recursively
    const processedPayments = decryptObject(recentPendingPaymentsJoined);
    const processedNotifications = decryptObject(recentNotificationsJoined);

    return NextResponse.json({
        stats: {
            totalRevenue,
            activeSubscriptions,
            pendingReviews: pendingReviewsRes.count || 0,
            pendingSubscriptions: pendingSubscriptionsCount,
        },
        recentPendingPayments: processedPayments,
        unreadNotifications: processedNotifications,
        weeklyTrends
    });

  } catch (e: any) {
    console.error('API /saas/dashboard-data error:', e);
    return NextResponse.json({ error: 'Internal Server Error', message: e.message }, { status: 500 });
  }
}

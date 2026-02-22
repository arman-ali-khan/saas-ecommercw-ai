
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Run count queries in parallel
    const [
        notifRes,
        subRes,
        seoRes,
        reviewRes,
        domainRes
    ] = await Promise.all([
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabaseAdmin.from('subscription_payments').select('*', { count: 'exact', head: true }).or('status.eq.pending,status.eq.pending_verification'),
        supabaseAdmin.from('seo_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('saas_reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabaseAdmin.from('custom_domain_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return NextResponse.json({
        unreadNotifications: notifRes.count || 0,
        pendingSubscriptions: subRes.count || 0,
        pendingSeoRequests: seoRes.count || 0,
        pendingReviews: reviewRes.count || 0,
        pendingDomains: domainRes.count || 0,
    });

  } catch (e: any) {
    console.error('API /saas/sidebar-counts error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

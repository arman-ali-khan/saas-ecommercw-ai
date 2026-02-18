
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Run all count queries in parallel for better performance
    const [
      ordersRes,
      notificationsRes,
      uncompletedRes,
      customersRes,
      reviewsRes,
      qnaRes
    ] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'approved'),
      supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', siteId)
        .eq('recipient_type', 'admin')
        .eq('is_read', false),
      supabaseAdmin
        .from('uncompleted_orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('is_viewed', false),
      supabaseAdmin
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId),
      supabaseAdmin
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('is_approved', false),
      supabaseAdmin
        .from('product_qna')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('is_approved', false),
    ]);

    const counts = {
      processingOrders: ordersRes.count || 0,
      unreadNotifications: notificationsRes.count || 0,
      unviewedUncompleted: uncompletedRes.count || 0,
      totalCustomers: customersRes.count || 0,
      pendingReviews: reviewsRes.count || 0,
      pendingQna: qnaRes.count || 0,
    };

    return NextResponse.json({ counts }, { status: 200 });
  } catch (err: any) {
    console.error('Admin Dashboard Counts API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

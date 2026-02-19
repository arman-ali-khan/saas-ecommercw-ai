
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Run count queries in parallel
    const [
        notifRes,
        subRes,
        seoRes,
        reviewRes
    ] = await Promise.all([
        supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabaseAdmin.from('subscription_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('seo_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('saas_reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false)
    ]);

    return NextResponse.json({
        unreadNotifications: notifRes.count || 0,
        pendingSubscriptions: subRes.count || 0,
        pendingSeoRequests: seoRes.count || 0,
        pendingReviews: reviewRes.count || 0,
    });

  } catch (e: any) {
    console.error('API /saas/sidebar-counts error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

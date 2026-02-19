
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * @fileOverview Secure API for SaaS admins to approve or reject store subscriptions.
 * Updates payment status, profile status, and notifies the store owner.
 */

export async function POST(request: Request) {
  try {
    const { paymentId, newStatus } = await request.json();

    if (!paymentId || !newStatus) {
      return NextResponse.json({ error: 'Payment ID and Status are required' }, { status: 400 });
    }

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
      .single();

    if (callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden: SaaS Admin access required.' }, { status: 403 });
    }

    // 3. Fetch current payment record to get user and plan info
    // We convert paymentId to Number to ensure it matches DB type
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('subscription_payments')
      .select('*, plans(name)')
      .eq('id', Number(paymentId))
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Subscription payment record not found.' }, { status: 404 });
    }

    // 4. Update Subscription Payment Status
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('subscription_payments')
      .update({ status: newStatus })
      .eq('id', Number(paymentId));

    if (paymentUpdateError) throw paymentUpdateError;

    // 5. Update User Profile Status & Notify
    let profileUpdate: any = {};
    let notificationMessage = '';

    if (newStatus === 'completed') {
      profileUpdate = {
        subscription_status: 'active',
        subscription_plan: payment.plan_id
      };
      notificationMessage = `আপনার ${payment.plans?.name || 'সাবস্ক্রিপশন'} পেমেন্ট সফলভাবে যাচাই করা হয়েছে এবং আপনার প্ল্যানটি সক্রিয় করা হয়েছে।`;
    } else if (newStatus === 'failed') {
      profileUpdate = {
        subscription_status: 'failed' // Set to failed instead of inactive to allow retry
      };
      notificationMessage = `দুঃখিত, আপনার সাবস্ক্রিপশন পেমেন্ট যাচাই করা সম্ভব হয়নি। অনুগ্রহ করে আপনার ট্রানজেকশন আইডি পরীক্ষা করুন বা সাপোর্টে যোগাযোগ করুন।`;
    }

    if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdate)
          .eq('id', payment.user_id);

        if (profileError) throw profileError;
    }

    // 6. Create notification for the store owner
    await supabaseAdmin.from('notifications').insert({
      recipient_id: payment.user_id,
      recipient_type: 'admin',
      site_id: payment.user_id,
      message: notificationMessage,
      link: '/admin/settings',
    });

    return NextResponse.json({ success: true, message: `Subscription status updated to ${newStatus}` });

  } catch (err: any) {
    console.error('API /saas/subscriptions/update-status Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

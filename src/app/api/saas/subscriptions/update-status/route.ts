
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { addMonths, addYears } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { paymentId, newStatus, updatedTransactionId } = await request.json();

    if (!paymentId || !newStatus) {
      return NextResponse.json({ error: 'Payment ID and Status are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single();
    if (callerProfile?.role !== 'saas_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch existing payment record
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('subscription_payments')
      .select('*, plans(*)')
      .eq('id', Number(paymentId))
      .single();

    if (fetchError || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const trxIdToUse = updatedTransactionId || payment.transaction_id;

    // 1. DUPLICATE CHECK (Only when completing)
    if (newStatus === 'completed' && trxIdToUse) {
        const { data: existingTrx } = await supabaseAdmin
            .from('subscription_payments')
            .select('id')
            .eq('transaction_id', trxIdToUse)
            .eq('status', 'completed')
            .neq('id', Number(paymentId))
            .maybeSingle();
        
        if (existingTrx) {
            // Notify store admin about duplication
            await supabaseAdmin.from('notifications').insert({
                recipient_id: payment.user_id,
                recipient_type: 'admin',
                site_id: payment.user_id,
                message: `Your subscription auto-verify failed. This Transaction ID (${trxIdToUse}) has already been used. Please provide a correct ID.`,
                link: '/admin/settings',
            });
            return NextResponse.json({ error: 'This Transaction ID is already used in another account.' }, { status: 400 });
        }
    }

    const updatePayload: any = { status: newStatus };
    if (updatedTransactionId) updatePayload.transaction_id = updatedTransactionId;

    const { error: paymentUpdateError } = await supabaseAdmin
      .from('subscription_payments')
      .update(updatePayload)
      .eq('id', Number(paymentId));

    if (paymentUpdateError) throw paymentUpdateError;

    let profileUpdate: any = {};
    let notificationMessage = '';

    if (newStatus === 'completed') {
      let endDate = null;
      if (payment.plans?.duration_value && payment.plans?.duration_unit) {
          const now = new Date();
          endDate = payment.plans.duration_unit === 'month' ? addMonths(now, payment.plans.duration_value) : addYears(now, payment.plans.duration_value);
      }
      profileUpdate = {
        subscription_status: 'active',
        subscription_plan: payment.plan_id,
        subscription_end_date: endDate ? endDate.toISOString() : null
      };
      notificationMessage = `আপনার ${payment.plans?.name || 'প্ল্যান'} পেমেন্ট সফলভাবে যাচাই করা হয়েছে। আপনার স্টোর এখন লাইভ!`;
    } else {
      profileUpdate = { subscription_status: newStatus === 'failed' ? 'failed' : 'inactive' };
      notificationMessage = `আপনার সাবস্ক্রিপশন পেমেন্ট রিভিউ করা হয়েছে। বর্তমান স্ট্যাটাস: ${newStatus.toUpperCase()}. কোনো সমস্যা থাকলে আমাদের সাথে যোগাযোগ করুন।`;
    }

    if (Object.keys(profileUpdate).length > 0) {
        await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', payment.user_id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;

    // Notify user with Push
    await fetch(`${baseUrl}/api/notifications/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: payment.user_id,
        recipientType: 'admin',
        siteId: payment.user_id,
        message: notificationMessage,
        link: '/admin/settings',
      }),
    }).catch(e => console.error("Subscription update push failed", e));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update Sub Status API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { addMonths, addYears } from 'date-fns';

/**
 * @fileOverview Stripe Webhook handler to listen for successful subscription payments.
 * Updates the database and profile status automatically.
 */

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { planId, siteId } = session.metadata;
    const transactionId = session.payment_intent || session.id;
    const amount = session.amount_total / 100;

    // 1. If it's an existing site admin upgrade
    if (siteId && siteId !== 'new_user') {
        // Fetch Plan Info
        const { data: plan } = await supabaseAdmin.from('plans').select('*').eq('id', planId).single();
        
        let endDate = null;
        if (plan?.duration_value && plan?.duration_unit) {
            const now = new Date();
            endDate = plan.duration_unit === 'month' ? addMonths(now, plan.duration_value) : addYears(now, plan.duration_value);
        }

        // Create payment record
        await supabaseAdmin.from('subscription_payments').insert({
            user_id: siteId,
            plan_id: planId,
            amount: amount,
            payment_method: 'credit_card',
            transaction_id: transactionId,
            status: 'completed',
            subscription_from: 'dashboard'
        });

        // Update profile
        await supabaseAdmin.from('profiles').update({
            subscription_status: 'active',
            subscription_plan: planId,
            subscription_end_date: endDate?.toISOString()
        }).eq('id', siteId);

        // Notify user
        await supabaseAdmin.from('notifications').insert({
            recipient_id: siteId,
            recipient_type: 'admin',
            site_id: siteId,
            message: `আপনার কার্ড পেমেন্ট সফল হয়েছে এবং ${plan?.name} প্ল্যানটি সক্রিয় করা হয়েছে।`,
            link: '/admin/settings'
        });
    } else {
        // New user flow: Just log it or handle via a different session management if needed.
        // Usually, for new users, we validate the session ID in the register-admin route.
        console.log('New user stripe payment completed:', session.id);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

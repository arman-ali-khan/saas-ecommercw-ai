
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, planId, amount, transactionId } = await request.json();

    if (!siteId || !planId || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create payment record
    const { error: paymentError } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        user_id: siteId,
        plan_id: planId,
        amount: amount,
        payment_method: 'mobile_banking',
        transaction_id: transactionId,
        status: 'pending_verification',
        subscription_from: 'dashboard'
      });

    if (paymentError) throw paymentError;

    // 2. Update profile status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'pending_verification',
        last_subscription_from: 'dashboard'
      })
      .eq('id', siteId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Request Plan Change API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addMonths, addYears } from 'date-fns';

/**
 * @fileOverview Callback handler for aamarPay payment execution.
 * Handles both new registrations and dashboard upgrades.
 */

export async function POST(request: Request) {
  const formData = await request.formData();
  const status = formData.get('pay_status');
  const tran_id = formData.get('mer_txnid') as string;
  const amount = formData.get('amount');
  
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId') || 'pro';
  const siteId = searchParams.get('siteId'); // Present if it's an upgrade

  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  if (status !== 'Successful' || !tran_id) {
    const errorUrl = siteId 
        ? `${origin}/admin/settings?payment=failed` 
        : `${origin}/get-started?step=payment&plan=${planId}&error=aamarpay_failed`;
    return NextResponse.redirect(errorUrl, { status: 303 });
  }

  // 1. DASHBOARD UPGRADE FLOW
  if (siteId) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // A. Verify with aamarPay API for security
        const storeId = process.env.AAMARPAY_STORE_ID || 'aamarpaytest';
        const signatureKey = process.env.AAMARPAY_SIGNATURE_KEY || 'dbb74894e82415a2f7ff0ec3a97e4183';
        const isSandbox = storeId === 'aamarpaytest';
        const verifyUrl = isSandbox 
            ? `https://sandbox.aamarpay.com/api/v1/trxcheck/request.php?request_id=${tran_id}&store_id=${storeId}&signature_key=${signatureKey}&type=json`
            : `https://secure.aamarpay.com/api/v1/trxcheck/request.php?request_id=${tran_id}&store_id=${storeId}&signature_key=${signatureKey}&type=json`;

        const verifyRes = await fetch(verifyUrl);
        const verifyData = await verifyRes.json();

        if (verifyData && verifyData.pay_status === 'Successful') {
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
                amount: parseFloat(String(amount || '0')),
                payment_method: 'aamarpay',
                transaction_id: tran_id,
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
                message: `আপনার অনলাইন পেমেন্ট (aamarPay) সফল হয়েছে এবং ${plan?.name} প্ল্যানটি সক্রিয় করা হয়েছে।`,
                link: '/admin/settings'
            });

            return NextResponse.redirect(`${origin}/admin/settings?payment=success`, { status: 303 });
        }
    } catch (e) {
        console.error("aamarPay upgrade verification error:", e);
    }
    
    return NextResponse.redirect(`${origin}/admin/settings?payment=failed`, { status: 303 });
  }

  // 2. NEW REGISTRATION FLOW
  // Just redirect to domain step, the register-admin API will do the verification
  return NextResponse.redirect(`${origin}/get-started?step=domain&plan=${planId}&aamarpay_trx_id=${tran_id}`, { status: 303 });
}

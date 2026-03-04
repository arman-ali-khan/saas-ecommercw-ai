import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { addMonths, addYears } from 'date-fns';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const paymentData = Object.fromEntries(formData.entries()) as any;

        // Note: In a real production app, you should call SSLCommerz validation API here
        // using the val_id to confirm the payment is genuine.

        const tran_id = paymentData.tran_id;
        const parts = tran_id.split('_');
        const type = parts[0]; // UPG or NEW
        const planId = parts[2];
        const siteId = parts[3];

        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. HANDLE UPGRADE FLOW
        if (type === 'UPG' && siteId && siteId !== 'NONE') {
            const { data: plan } = await supabaseAdmin.from('plans').select('*').eq('id', planId).single();
            
            let endDate = null;
            if (plan?.duration_value && plan?.duration_unit) {
                const now = new Date();
                endDate = plan.duration_unit === 'month' 
                    ? addMonths(now, plan.duration_value) 
                    : addYears(now, plan.duration_value);
            }

            // Create payment record
            await supabaseAdmin.from('subscription_payments').insert({
                user_id: siteId,
                plan_id: planId,
                amount: parseFloat(String(paymentData.amount || '0')),
                payment_method: 'sslcommerz',
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
                message: `আপনার অনলাইন পেমেন্ট (SSLCommerz) সফল হয়েছে এবং ${plan?.name} প্ল্যানটি সক্রিয় করা হয়েছে।`,
                link: '/admin/settings'
            });

            return NextResponse.redirect(`${origin}/admin/settings?payment=success`, 303);
        }

        // 2. HANDLE NEW REGISTRATION FLOW
        // Redirect to domain step, the register-admin API will do the final verification
        return NextResponse.redirect(`${origin}/get-started?step=domain&plan=${planId}&ssl_trx_id=${tran_id}`, 303);

    } catch (err: any) {
        console.error("SSLCommerz Success Route Error:", err);
        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        return NextResponse.redirect(`${protocol}://${host}/payment/error`, 303);
    }
}

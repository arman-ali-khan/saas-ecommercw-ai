import SSLCommerzPayment from "sslcommerz-nodejs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId, amount, origin, siteId, email, fullName, phone } = body;

        if (!planId || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Generate a descriptive transaction ID
        const type = siteId ? 'UPG' : 'NEW';
        const tran_id = `${type}_${Date.now()}_${planId}_${siteId || 'NONE'}`;

        const data = {
            total_amount: amount,
            currency: 'BDT',
            tran_id: tran_id,
            success_url: `${origin}/api/saas/payments/sslcommerz/success`,
            fail_url: `${origin}/api/saas/payments/sslcommerz/fail`,
            cancel_url: `${origin}/api/saas/payments/sslcommerz/cancel`,
            ipn_url: `${origin}/api/saas/payments/sslcommerz/ipn`,
            shipping_method: 'No',
            product_name: `SaaS Plan: ${planId.toUpperCase()}`,
            product_category: 'Service',
            product_profile: 'non-physical-goods',
            cus_name: fullName || 'Guest User',
            cus_email: email || 'guest@example.com',
            cus_add1: 'Dhaka',
            cus_city: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: phone || '01700000000',
        };

        const sslcz = new (SSLCommerzPayment as any)(
            process.env.SSL_STORE_ID,
            process.env.SSL_STORE_PASSWORD,
            process.env.SSL_IS_LIVE === 'true'
        );

        const apiResponse = await sslcz.init(data);

        if (apiResponse && apiResponse.GatewayPageURL) {
            return NextResponse.json({ url: apiResponse.GatewayPageURL });
        } else {
            throw new Error(apiResponse.failedreason || 'SSLCommerz initiation failed');
        }
    } catch (err: any) {
        console.error("SSLCommerz Init Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

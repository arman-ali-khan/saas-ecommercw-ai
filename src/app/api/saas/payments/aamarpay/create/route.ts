
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileOverview API to initialize aamarPay Payment for SaaS subscriptions.
 * Supports both new users and dashboard upgrades.
 */

export async function POST(request: Request) {
  try {
    const { planId, amount, origin, fullName, email, phone, siteId } = await request.json();

    if (!planId || !amount) {
      return NextResponse.json({ error: 'Missing required checkout parameters.' }, { status: 400 });
    }

    const storeId = process.env.AAMARPAY_STORE_ID || 'aamarpaytest';
    const signatureKey = process.env.AAMARPAY_SIGNATURE_KEY || 'dbb74894e82415a2f7ff0ec3a97e4183';
    const isSandbox = storeId === 'aamarpaytest';
    
    const baseUrl = isSandbox 
      ? 'https://sandbox.aamarpay.com/jsonpost.php' 
      : 'https://secure.aamarpay.com/jsonpost.php';

    const tranId = `SAAS-${uuidv4().slice(0, 8)}`;

    // If siteId is provided, it's an upgrade from the dashboard
    const successUrl = siteId 
        ? `${origin}/api/saas/payments/aamarpay/callback?planId=${planId}&siteId=${siteId}`
        : `${origin}/api/saas/payments/aamarpay/callback?planId=${planId}`;

    const formData = {
      store_id: storeId,
      signature_key: signatureKey,
      cus_name: fullName || 'Guest User',
      cus_email: email || 'guest@example.com',
      cus_phone: phone || '01700000000',
      amount: amount.toString(),
      currency: 'BDT',
      tran_id: tranId,
      desc: `SaaS Subscription: ${planId.toUpperCase()}`,
      success_url: successUrl,
      fail_url: siteId ? `${origin}/admin/settings?payment=failed` : `${origin}/get-started?step=payment&plan=${planId}&error=aamarpay_failed`,
      cancel_url: siteId ? `${origin}/admin/settings?payment=cancelled` : `${origin}/get-started?step=payment&plan=${planId}&error=aamarpay_cancelled`,
      type: 'json'
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.result === 'true' && result.payment_url) {
      return NextResponse.json({ paymentURL: result.payment_url }, { status: 200 });
    } else {
      throw new Error(result.error || 'Failed to generate aamarPay URL');
    }

  } catch (err: any) {
    console.error('aamarPay Create Payment API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

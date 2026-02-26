
import { NextResponse } from 'next/server';
// Use dynamic import or handle CJS properly in ESM
import Bkash from 'bkash-payment';

/**
 * @fileOverview API to initialize bKash Payment for SaaS subscriptions.
 */

export async function POST(request: Request) {
  try {
    const { planId, amount, origin } = await request.json();

    if (!planId || !amount || !origin) {
      return NextResponse.json({ error: 'Missing required checkout parameters.' }, { status: 400 });
    }

    // Handle potential interop issues with CommonJS default exports
    const BkashConstructor = (Bkash as any).default || Bkash;
    
    const bkash = new BkashConstructor({
      bkash_app_key: process.env.BKASH_APP_KEY || 'your_sandbox_app_key',
      bkash_app_secret: process.env.BKASH_APP_SECRET || 'your_sandbox_app_secret',
      bkash_username: process.env.BKASH_USERNAME || 'your_sandbox_username',
      bkash_password: process.env.BKASH_PASSWORD || 'your_sandbox_password',
      is_sandbox: true // Always sandbox based on user request
    });

    const paymentData = await bkash.createPayment({
      amount: amount.toString(),
      orderID: `SAAS-${planId}-${Date.now()}`,
      intent: 'sale',
      callbackURL: `${origin}/api/saas/payments/bkash/callback`
    });

    if (paymentData && paymentData.bkashURL) {
      return NextResponse.json({ bkashURL: paymentData.bkashURL }, { status: 200 });
    } else {
      throw new Error(paymentData?.statusMessage || 'Failed to generate bKash URL');
    }

  } catch (err: any) {
    console.error('bKash Create Payment Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

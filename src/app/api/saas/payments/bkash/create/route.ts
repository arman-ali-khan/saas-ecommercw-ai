
import { NextResponse } from 'next/server';
import Bkash from 'bkash-payment';

/**
 * @fileOverview API to initialize bKash Payment for SaaS subscriptions.
 * Enhanced constructor interop for Next.js API environment.
 */

export async function POST(request: Request) {
  try {
    const { planId, amount, origin } = await request.json();

    if (!planId || !amount || !origin) {
      return NextResponse.json({ error: 'Missing required checkout parameters.' }, { status: 400 });
    }

    // Robust constructor resolution for CommonJS module in ESM environment
    let BkashConstructor: any;
    
    if (typeof Bkash === 'function') {
        BkashConstructor = Bkash;
    } else if (Bkash && typeof (Bkash as any).default === 'function') {
        BkashConstructor = (Bkash as any).default;
    } else {
        // Fallback for some bundling environments
        const bKashModule = require('bkash-payment');
        BkashConstructor = bKashModule.default || bKashModule;
    }
    
    if (typeof BkashConstructor !== 'function') {
        console.error('bKash Module Structure:', Bkash);
        throw new Error('bKash module failed to load as a constructor. Please ensure "bkash-payment" is installed correctly.');
    }

    const bkash = new BkashConstructor({
      bkash_app_key: process.env.BKASH_APP_KEY || 'your_sandbox_app_key',
      bkash_app_secret: process.env.BKASH_APP_SECRET || 'your_sandbox_app_secret',
      bkash_username: process.env.BKASH_USERNAME || 'your_sandbox_username',
      bkash_password: process.env.BKASH_PASSWORD || 'your_sandbox_password',
      is_sandbox: true // Always use sandbox for testing
    });

    const paymentData = await bkash.createPayment({
      amount: amount.toString(),
      orderID: `SAAS-${planId}-${Date.now()}`,
      intent: 'sale',
      callbackURL: `${origin}/api/saas/payments/bkash/callback?planId=${planId}`
    });

    if (paymentData && paymentData.bkashURL) {
      return NextResponse.json({ bkashURL: paymentData.bkashURL }, { status: 200 });
    } else {
      throw new Error(paymentData?.statusMessage || 'Failed to generate bKash URL');
    }

  } catch (err: any) {
    console.error('bKash Create Payment API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import Bkash from 'bkash-payment';

/**
 * @fileOverview Callback handler for bKash payment execution.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentID = searchParams.get('paymentID');
  const status = searchParams.get('status');
  const planId = searchParams.get('planId') || 'pro';

  const origin = request.headers.get('origin') || `${new URL(request.url).protocol}//${request.headers.get('host')}`;

  if (status !== 'success') {
    return NextResponse.redirect(`${origin}/get-started?step=payment&plan=${planId}&error=bkash_failed`);
  }

  try {
    const BkashConstructor = (Bkash as any).default || Bkash;

    const bkash = new BkashConstructor({
      bkash_app_key: process.env.BKASH_APP_KEY || 'your_sandbox_app_key',
      bkash_app_secret: process.env.BKASH_APP_SECRET || 'your_sandbox_app_secret',
      bkash_username: process.env.BKASH_USERNAME || 'your_sandbox_username',
      bkash_password: process.env.BKASH_PASSWORD || 'your_sandbox_password',
      is_sandbox: true
    });

    // Execute the payment
    const executeRes = await bkash.executePayment(paymentID);

    if (executeRes && executeRes.transactionStatus === 'Completed') {
      // Payment successful, redirect to domain step
      return NextResponse.redirect(`${origin}/get-started?step=domain&plan=${planId}&bkash_payment_id=${executeRes.paymentID}&trx_id=${executeRes.trxID}`);
    } else {
      throw new Error(executeRes?.statusMessage || 'bKash execution failed');
    }

  } catch (err: any) {
    console.error('bKash Callback Error:', err);
    return NextResponse.redirect(`${origin}/get-started?step=payment&plan=${planId}&error=bkash_verify_failed`);
  }
}

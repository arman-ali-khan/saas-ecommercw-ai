
import { NextResponse } from 'next/server';

/**
 * @fileOverview Callback handler for aamarPay payment execution.
 */

export async function POST(request: Request) {
  const formData = await request.formData();
  const status = formData.get('pay_status');
  const tran_id = formData.get('mer_txnid');
  const amount = formData.get('amount');
  
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId') || 'pro';

  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  if (status !== 'Successful' || !tran_id) {
    return NextResponse.redirect(`${origin}/get-started?step=payment&plan=${planId}&error=aamarpay_failed`, { status: 303 });
  }

  // Payment successful, redirect to domain step with transaction ID
  return NextResponse.redirect(`${origin}/get-started?step=domain&plan=${planId}&aamarpay_trx_id=${tran_id}`, { status: 303 });
}

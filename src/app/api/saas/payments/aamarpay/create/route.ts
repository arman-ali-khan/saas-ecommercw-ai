import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'aamarPay integration removed. Please use SSLCommerz.' }, { status: 410 });
}


import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: "bKash integration removed. Use aamarPay instead." }, { status: 410 });
}

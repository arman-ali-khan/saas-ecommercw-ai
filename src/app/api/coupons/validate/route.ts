
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { code, siteId, subtotal } = await request.json();

    if (!code || !siteId) {
      return NextResponse.json({ error: 'Code and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('site_id', siteId)
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is no longer active.' }, { status: 400 });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'Usage limit reached for this coupon.' }, { status: 400 });
    }

    if (subtotal < coupon.min_order_amount) {
      return NextResponse.json({ 
        error: `Minimum order amount for this coupon is ${coupon.min_order_amount} BDT.` 
      }, { status: 400 });
    }

    return NextResponse.json({ coupon }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, ...couponData } = body;

    if (!siteId || !couponData.code) {
      return NextResponse.json({ error: 'Site ID and Code are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      site_id: siteId,
      code: couponData.code.toUpperCase().trim(),
      discount_type: couponData.discount_type,
      discount_value: parseFloat(couponData.discount_value),
      min_order_amount: parseFloat(couponData.min_order_amount || 0),
      max_discount_amount: couponData.max_discount_amount ? parseFloat(couponData.max_discount_amount) : null,
      expiry_date: couponData.expiry_date || null,
      usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit) : null,
      is_active: couponData.is_active ?? true,
    };

    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('coupons')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This coupon code already exists.' }, { status: 409 });
        }
        throw error;
      }
      result = data;
    }

    return NextResponse.json({ success: true, coupon: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Coupon API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

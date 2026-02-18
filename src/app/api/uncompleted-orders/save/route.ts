
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, site_id, customer_id, customer_info, cart_items, cart_total, status } = body;

    if (!id || !site_id) {
      return NextResponse.json({ error: 'Missing ID or Site ID' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('uncompleted_orders')
      .upsert({
        id,
        site_id,
        customer_id: customer_id || null,
        customer_info,
        cart_items,
        cart_total,
        status: status || 'shipping-info-entered',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Save Uncompleted Order API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (err: any) {
    console.error('Save Uncompleted Order API Catch Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

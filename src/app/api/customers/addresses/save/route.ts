
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, customerId, siteId, ...addressData } = await request.json();

    if (!customerId || !siteId) {
      return NextResponse.json({ error: 'Missing required IDs' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('customer_addresses')
        .update(addressData)
        .match({ id, customer_id: customerId })
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('customer_addresses')
        .insert({ ...addressData, customer_id: customerId, site_id: siteId })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ address: result }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

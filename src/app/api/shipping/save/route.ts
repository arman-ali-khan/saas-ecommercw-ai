
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId, name, price, is_enabled } = await request.json();

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Missing required fields (siteId, name)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      site_id: siteId,
      name,
      price: price || 0,
      is_enabled: is_enabled ?? true,
    };

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('shipping_zones')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('shipping_zones')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, zone: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Shipping Zone API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

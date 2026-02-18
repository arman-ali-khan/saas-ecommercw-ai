
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId, type, value } = await request.json();

    if (!siteId || !type || !value) {
      return NextResponse.json({ error: 'Missing required fields (siteId, type, value)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    if (id) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('product_attributes')
        .update({ type, value })
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('product_attributes')
        .insert({ site_id: siteId, type, value })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, attribute: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Attribute API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

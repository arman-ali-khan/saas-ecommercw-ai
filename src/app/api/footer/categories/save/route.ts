
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId, title, order } = await request.json();

    if (!siteId || !title) {
      return NextResponse.json({ error: 'Site ID and Title are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = { site_id: siteId, title, order: order || 0 };

    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('footer_link_categories')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('footer_link_categories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, category: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Footer Category API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId, categoryId, label, href, order } = await request.json();

    if (!siteId || !categoryId || !label || !href) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = { site_id: siteId, category_id: categoryId, label, href, order: order || 0 };

    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('footer_links')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('footer_links')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, link: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Footer Link API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

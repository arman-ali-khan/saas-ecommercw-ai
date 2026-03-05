
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, title, slug, data, is_published } = body;

    if (!siteId || !title || !slug || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      site_id: siteId,
      title,
      slug,
      data,
      is_published: is_published ?? false,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      const { data: updated, error } = await supabaseAdmin
        .from('advance_pages')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      if (error) throw error;
      result = updated;
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from('advance_pages')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      result = inserted;
    }

    return NextResponse.json({ success: true, page: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Advance Page Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

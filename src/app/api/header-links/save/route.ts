
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, label, href } = body;

    if (!siteId || !label || !href) {
      return NextResponse.json({ error: 'Missing required fields (siteId, label, href)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('header_links')
        .update({ label, href })
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create - Find current max order
      const { data: lastLink } = await supabaseAdmin
        .from('header_links')
        .select('order')
        .eq('site_id', siteId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const newOrder = lastLink ? lastLink.order + 1 : 0;

      const { data, error } = await supabaseAdmin
        .from('header_links')
        .insert({ site_id: siteId, label, href, order: newOrder })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, link: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Header Link API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

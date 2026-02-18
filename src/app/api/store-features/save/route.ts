
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, ...featureData } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('store_features')
        .update(featureData)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create - Find current max order
      const { data: lastItem } = await supabaseAdmin
        .from('store_features')
        .select('order')
        .eq('site_id', siteId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const newOrder = lastItem ? lastItem.order + 1 : 0;

      const { data, error } = await supabaseAdmin
        .from('store_features')
        .insert({ ...featureData, site_id: siteId, order: newOrder })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, feature: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Store Feature API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

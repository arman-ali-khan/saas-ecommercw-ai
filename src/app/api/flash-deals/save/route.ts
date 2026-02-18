
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, ...dealData } = body;

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
        .from('flash_deals')
        .update(dealData)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('flash_deals')
        .insert({ ...dealData, site_id: siteId })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This product already has an active flash deal.' }, { status: 409 });
        }
        throw error;
      }
      result = data;
    }

    return NextResponse.json({ success: true, deal: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Flash Deal API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

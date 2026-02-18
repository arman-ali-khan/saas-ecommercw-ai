
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId } = await request.json();

    if (!id || !siteId) {
      return NextResponse.json({ error: 'ID and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('uncompleted_orders')
      .select('*')
      .match({ id, site_id: siteId })
      .single();

    if (error) throw error;

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (err: any) {
    console.error('Get Uncompleted Order API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

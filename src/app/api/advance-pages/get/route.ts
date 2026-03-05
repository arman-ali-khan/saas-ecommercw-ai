
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId } = await request.json();

    if (!id || !siteId) {
      return NextResponse.json({ error: 'Missing ID or Site ID' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('advance_pages')
      .select('*')
      .match({ id, site_id: siteId })
      .single();

    if (error) throw error;

    return NextResponse.json({ page: data }, { status: 200 });
  } catch (err: any) {
    console.error('Get Advance Page Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

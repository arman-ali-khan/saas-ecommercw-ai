
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('advance_pages')
      .select('id, title, slug, is_published, updated_at')
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ pages: data }, { status: 200 });
  } catch (err: any) {
    console.error('List Advance Pages Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

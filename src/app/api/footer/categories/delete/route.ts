
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

    // Cascading delete is handled by database if configured, 
    // but we match by site_id for security.
    const { error } = await supabaseAdmin
      .from('footer_link_categories')
      .delete()
      .match({ id, site_id: siteId });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete Footer Category API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

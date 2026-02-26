
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, url, name } = await request.json();

    if (!siteId || !url) {
      return NextResponse.json({ error: 'Site ID and URL are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('site_images')
      .insert({ site_id: siteId, url, name: name || 'Untitled' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, image: data }, { status: 201 });
  } catch (err: any) {
    console.error('Save Image API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

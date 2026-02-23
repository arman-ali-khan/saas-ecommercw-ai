import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const siteId = body.siteId;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Using select('*') to avoid crashes if new columns don't exist yet
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .eq('site_id', siteId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Database query error in get appearance:', error);
      throw error;
    }

    return NextResponse.json({ appearance: data || {} }, { status: 200 });
  } catch (err: any) {
    console.error('Get Appearance API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

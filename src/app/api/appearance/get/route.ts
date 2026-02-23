
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const siteIdValue = body.siteId;

    if (!siteIdValue) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settingsRecord, error: queryError } = await supabaseAdmin
      .from('store_settings')
      .select('*')
      .eq('site_id', siteIdValue)
      .maybeSingle();

    if (queryError) {
      console.error('Database query error in get appearance:', queryError);
      return NextResponse.json({ appearance: {} }, { status: 200 });
    }

    return NextResponse.json({ appearance: settingsRecord || {} }, { status: 200 });
  } catch (err: any) {
    console.error('Get Appearance API Error:', err);
    return NextResponse.json({ appearance: {}, error: err.message }, { status: 200 });
  }
}

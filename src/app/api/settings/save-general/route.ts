
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, siteName, siteDescription } = await request.json();

    if (!siteId || !siteName) {
      return NextResponse.json({ error: 'Site ID and Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        site_name: siteName,
        site_description: siteDescription
      })
      .eq('id', siteId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save General Settings API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

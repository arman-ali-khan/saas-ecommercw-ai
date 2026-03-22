
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, themeConfig } = await request.json();

    if (!siteId || !themeConfig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Subscription check
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', siteId)
        .single();

    if (profile?.subscription_status !== 'active') {
        return NextResponse.json({ error: 'This feature requires an active subscription.' }, { status: 403 });
    }

    // 2. Save JSON to store_settings
    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ 
        site_id: siteId, 
        theme_config: themeConfig 
      }, { onConflict: 'site_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save Theme Config API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

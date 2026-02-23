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

    // Explicitly select ALL theme fields to ensure consistency
    const { data, error } = await supabaseAdmin
      .from('store_settings')
      .select(`
        theme_mode,
        theme_primary, 
        theme_primary_foreground,
        theme_secondary, 
        theme_secondary_foreground,
        theme_accent, 
        theme_accent_foreground,
        theme_background, 
        theme_foreground, 
        theme_card, 
        theme_card_foreground,
        theme_muted,
        theme_muted_foreground,
        theme_border,
        theme_input,
        theme_destructive,
        font_primary, 
        font_secondary
      `)
      .eq('site_id', siteId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ appearance: data || {} }, { status: 200 });
  } catch (err: any) {
    console.error('Get Appearance API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

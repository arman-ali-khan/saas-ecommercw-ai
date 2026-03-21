
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview API to list all active themes available for stores.
 */

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('store_themes')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ themes: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('List Public Themes API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
}

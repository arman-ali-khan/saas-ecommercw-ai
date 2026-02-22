
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
      .from('custom_domain_requests')
      .select('*')
      .eq('site_id', siteId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ request: data || null }, { status: 200 });
  } catch (err: any) {
    console.error('Get Custom Domain Request API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

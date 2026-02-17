
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
      .from('shipping_zones')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_enabled', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching shipping zones from API:', error);
      return NextResponse.json({ error: 'Failed to fetch shipping zones.' }, { status: 500 });
    }

    return NextResponse.json({ zones: data }, { status: 200 });
  } catch (e: any) {
    console.error('API /get-shipping-zones Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

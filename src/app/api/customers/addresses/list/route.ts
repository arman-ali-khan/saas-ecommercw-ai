
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { customerId, siteId } = await request.json();

    if (!customerId || !siteId) {
      return NextResponse.json({ error: 'Missing required IDs' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .match({ customer_id: customerId, site_id: siteId })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ addresses: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

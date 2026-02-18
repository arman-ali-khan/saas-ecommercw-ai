
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { customerId, siteId } = await request.json();

    if (!customerId || !siteId) {
      return NextResponse.json({ error: 'Customer ID and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('id, full_name, email, site_id, role, created_at')
      .match({ id: customerId, site_id: siteId })
      .single();

    if (error) {
      return NextResponse.json({ error: 'Customer profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ customer: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

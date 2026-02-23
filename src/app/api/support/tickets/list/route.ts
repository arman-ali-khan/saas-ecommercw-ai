
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('support_tickets')
      .select('*, profiles(site_name, full_name, email)');

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tickets: data }, { status: 200 });
  } catch (err: any) {
    console.error('List Tickets API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

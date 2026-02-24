
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

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

    // Decrypt sensitive user info in the joined profiles
    const decryptedTickets = decryptObject(data);

    return NextResponse.json({ tickets: decryptedTickets }, { status: 200 });
  } catch (err: any) {
    console.error('List Tickets API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

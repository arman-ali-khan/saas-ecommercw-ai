
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
      .from('notifications')
      .select('*')
      .eq('recipient_id', customerId)
      .eq('site_id', siteId)
      .eq('recipient_type', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer notifications from API:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications.' }, { status: 500 });
    }

    return NextResponse.json({ notifications: data }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

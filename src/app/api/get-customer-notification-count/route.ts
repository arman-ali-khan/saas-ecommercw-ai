
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

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', customerId)
      .eq('site_id', siteId)
      .eq('recipient_type', 'customer')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching customer notification count from API:', error);
      return NextResponse.json({ error: 'Failed to fetch notification count.' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

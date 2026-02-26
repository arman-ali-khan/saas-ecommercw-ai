import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { recipientId, recipientType, siteId, limit = 50 } = await request.json();

    // recipientType is mandatory
    if (!recipientType) {
      return NextResponse.json({ error: 'Recipient Type is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('recipient_type', recipientType);

    // If recipientId is provided, filter by it. 
    // If NOT provided AND type is 'admin', we might be fetching global SaaS alerts (where recipient_id is null)
    if (recipientId) {
      query = query.eq('recipient_id', recipientId);
    } else if (recipientType === 'admin') {
      // For SaaS admin view, we often want all admin-targeted notifications regardless of specific ID,
      // or specifically those meant for the system (where recipient_id is null).
      // Here we assume if no ID is passed, we want the system-wide list.
      query = query.is('recipient_id', null);
    }

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ notifications: data }, { status: 200 });
  } catch (err: any) {
    console.error('List Notifications API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { notificationId, recipientId, all = false } = await request.json();

    if (!recipientId && !notificationId) {
      return NextResponse.json({ error: 'Notification ID or Recipient ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin.from('notifications').update({ is_read: true });

    if (all && recipientId) {
      query = query.eq('recipient_id', recipientId).eq('is_read', false);
    } else if (notificationId) {
      query = query.eq('id', notificationId);
    } else {
        return NextResponse.json({ error: 'Invalid parameters for marking as read.' }, { status: 400 });
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Mark Notification Read API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

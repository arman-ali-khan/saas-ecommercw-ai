
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { recipientIds, message, link } = await request.json();

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0 || !message) {
      return NextResponse.json({ error: 'Recipient IDs and message are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create a notification row for each selected admin
    const notifications = recipientIds.map(id => ({
      recipient_id: id,
      recipient_type: 'admin',
      site_id: id, // For site admins, their ID is their site_id
      message,
      link: link || null,
    }));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, count: data.length }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk Create Notification API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

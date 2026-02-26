
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { recipientId, recipientType, siteId, message, link, orderId } = await request.json();

    // Basic validation: recipientType and message are always required.
    // recipientId can be null for platform-level notifications meant for SaaS admins.
    if (!recipientType || !message) {
      return NextResponse.json({ error: 'Missing required notification fields (recipientType, message).' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: recipientId || null,
        recipient_type: recipientType,
        site_id: siteId || null,
        message,
        link: link || null,
        order_id: orderId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data }, { status: 201 });
  } catch (err: any) {
    console.error('Create Notification API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

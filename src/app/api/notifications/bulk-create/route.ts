
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messaging } from '@/lib/firebase-admin';

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

    // 1. Bulk DB Insert
    const notifications = recipientIds.map(id => ({
      recipient_id: id,
      recipient_type: 'admin',
      site_id: id,
      message,
      link: link || null,
    }));

    const { error: dbError } = await supabaseAdmin.from('notifications').insert(notifications);
    if (dbError) throw dbError;

    // 2. Fetch all tokens for recipients
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id, fcm_tokens')
      .in('id', recipientIds);

    if (users) {
      const allTokens = users.flatMap(u => u.fcm_tokens || []);
      if (allTokens.length > 0) {
        const payload = {
          notification: {
            title: 'Platform Announcement',
            body: message,
          },
          data: { link: link || '/' },
          tokens: allTokens,
        };
        await messaging.sendEachForMulticast(payload).catch(e => console.error("Bulk FCM Error:", e));
      }
    }

    return NextResponse.json({ success: true, count: recipientIds.length }, { status: 201 });
  } catch (err: any) {
    console.error('Bulk Create Notification API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messaging } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { recipientId, recipientType, siteId, message, link, orderId } = await request.json();

    if (!recipientType || !message) {
      return NextResponse.json({ error: 'Missing required notification fields.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create DB Notification
    const { data: notification, error: dbError } = await supabaseAdmin
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

    if (dbError) throw dbError;

    // 2. Send Push Notification via Firebase
    if (recipientId) {
      const table = recipientType === 'admin' ? 'profiles' : 'customer_profiles';
      const { data: userProfile } = await supabaseAdmin
        .from(table)
        .select('fcm_tokens, site_name')
        .eq('id', recipientId)
        .single();

      if (userProfile?.fcm_tokens && userProfile.fcm_tokens.length > 0) {
        const title = recipientType === 'admin' ? 'New Dashboard Alert' : (userProfile.site_name || 'Store Update');
        
        const payload = {
          notification: {
            title: title,
            body: message,
          },
          data: {
            link: link || '/',
            click_action: 'FLUTTER_NOTIFICATION_CLICK', // Common convention
          },
          tokens: userProfile.fcm_tokens,
        };

        try {
          const response = await messaging.sendEachForMulticast(payload);
          console.log(`FCM success: ${response.successCount}, failure: ${response.failureCount}`);
          
          // Cleanup invalid tokens
          if (response.failureCount > 0) {
            const validTokens = userProfile.fcm_tokens.filter((_, i) => response.responses[i].success);
            if (validTokens.length !== userProfile.fcm_tokens.length) {
                await supabaseAdmin.from(table).update({ fcm_tokens: validTokens }).eq('id', recipientId);
            }
          }
        } catch (fcmError) {
          console.error('FCM send error:', fcmError);
        }
      }
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (err: any) {
    console.error('Create Notification API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

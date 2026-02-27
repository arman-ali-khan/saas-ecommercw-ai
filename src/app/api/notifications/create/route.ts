
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { messaging } from '@/lib/firebase-admin';

/**
 * @fileOverview Standard API to create a notification and trigger a Firebase Push Notification.
 * Handles single recipients and platform-wide SaaS Admin alerts.
 */

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

    // 2. Resolve Recipients for Push
    let targetTokens: string[] = [];
    let notificationTitle = 'New Update';

    if (recipientId) {
      // Direct recipient (Store Admin or Customer)
      const table = recipientType === 'admin' ? 'profiles' : 'customer_profiles';
      const { data: userProfile } = await supabaseAdmin
        .from(table)
        .select('fcm_tokens, site_name')
        .eq('id', recipientId)
        .single();

      if (userProfile?.fcm_tokens) {
        targetTokens = userProfile.fcm_tokens;
        notificationTitle = recipientType === 'admin' ? 'Dashboard Alert' : (userProfile.site_name || 'Store Update');
      }
    } else if (recipientType === 'admin') {
      // Platform level alert for SaaS Admins
      const { data: saasAdmins } = await supabaseAdmin
        .from('profiles')
        .select('fcm_tokens')
        .eq('role', 'saas_admin');
      
      if (saasAdmins) {
        targetTokens = saasAdmins.flatMap(admin => admin.fcm_tokens || []);
        notificationTitle = 'Platform Request';
      }
    }

    // 3. Send Push Notification via Firebase
    if (targetTokens.length > 0) {
      const payload = {
        notification: {
          title: notificationTitle,
          body: message,
        },
        data: {
          link: link || '/',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        tokens: targetTokens,
      };

      try {
        const response = await messaging.sendEachForMulticast(payload);
        console.log(`FCM success: ${response.successCount}, failure: ${response.failureCount}`);
      } catch (fcmError) {
        console.error('FCM send error:', fcmError);
      }
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (err: any) {
    console.error('Create Notification API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decryptObject } from '@/lib/encryption';

/**
 * @fileOverview Order creation API with improved reliability and notification logic.
 */

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const orderData = await request.json();
    const { domain, uncompletedOrderId, ...dbOrderData } = orderData;

    if (!dbOrderData || !dbOrderData.site_id || !dbOrderData.cart_items) {
      return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
    }

    // Encrypt sensitive customer data before database insertion
    const encryptedOrderData = {
        ...dbOrderData,
        customer_email: encrypt(dbOrderData.customer_email),
        shipping_info: {
            ...dbOrderData.shipping_info,
            name: encrypt(dbOrderData.shipping_info.name),
            address: encrypt(dbOrderData.shipping_info.address),
            city: encrypt(dbOrderData.shipping_info.city),
            phone: encrypt(dbOrderData.shipping_info.phone),
            notes: dbOrderData.shipping_info.notes ? encrypt(dbOrderData.shipping_info.notes) : null
        }
    };

    // 1. Create the Order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ ...encryptedOrderData, status: 'pending' })
      .select()
      .single();

    if (orderError) {
        console.error("Supabase Order Insert Error:", orderError);
        return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    
    // 2. Cleanup Uncompleted Order
    if (uncompletedOrderId) {
        await supabaseAdmin.from('uncompleted_orders').delete().eq('id', uncompletedOrderId);
    }

    // 3. Handle Notifications (Direct Insert to avoid network loops)
    if (newOrder) {
      const orderNum = newOrder.order_number;
      
      // Admin Notification
      await supabaseAdmin.from('notifications').insert({
          recipient_id: newOrder.site_id,
          recipient_type: 'admin',
          site_id: newOrder.site_id,
          order_id: newOrder.id,
          message: `একটি নতুন অর্ডার #${orderNum} এসেছে। মোট: ${newOrder.total.toFixed(2)} BDT.`,
          link: `/admin/orders/${newOrder.id}`,
      });

      // Customer Notification (if logged in)
      if (newOrder.customer_id) {
        await supabaseAdmin.from('notifications').insert({
            recipient_id: newOrder.customer_id,
            recipient_type: 'customer',
            site_id: newOrder.site_id,
            order_id: newOrder.id,
            message: `আপনার অর্ডার #${orderNum} সফলভাবে গ্রহণ করা হয়েছে।`,
            link: `/profile/orders/${newOrder.id}`,
        });
      }

      // 4. Trigger External SMS (Background)
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('subscription_plan')
          .eq('id', newOrder.site_id)
          .single();

        const { data: settings } = await supabaseAdmin
          .from('store_settings')
          .select('sms_notifications_enabled, admin_sms_number')
          .eq('site_id', newOrder.site_id)
          .single();

        if (profile?.subscription_plan !== 'free' && settings?.sms_notifications_enabled && settings?.admin_sms_number) {
          // Fire and forget SMS call
          fetch('https://and-api.vercel.app/api/smsData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: dbOrderData.shipping_info.name,
              customerEmail: dbOrderData.customer_email,
              adminPhone: settings.admin_sms_number,
              orderAmount: dbOrderData.total,
              orderNumber: orderNum,
              orderId: newOrder.id,
              paymentType: dbOrderData.payment_method === 'cod' ? 'cod' : 'paid',
              paymentMethod: dbOrderData.payment_method,
              domain: `${domain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ihut.shop'}`
            }),
          }).catch(err => console.error("External SMS API Hook Error:", err));
        }
      } catch (smsSkipErr) {
          // SMS failure shouldn't crash the order success
          console.warn("SMS Processing skipped or failed.");
      }
    }

    return NextResponse.json({ 
        order: decryptObject(newOrder),
        message: 'Order created successfully' 
    }, { status: 200 });

  } catch (err: any) {
    console.error('CRITICAL ORDER API ERROR:', err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}

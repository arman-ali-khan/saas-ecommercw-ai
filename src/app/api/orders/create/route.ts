import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const { domain, uncompletedOrderId, ...dbOrderData } = orderData;

    if (!dbOrderData || !dbOrderData.site_id || !dbOrderData.cart_items) {
      return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Encrypt sensitive order data for database storage
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

    // 1. Create the order in Supabase
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ ...encryptedOrderData, status: 'pending' })
      .select()
      .single();

    if (orderError) {
      console.error('Create Order API Error:', orderError);
      return NextResponse.json({ error: `Database Error: ${orderError.message}` }, { status: 500 });
    }
    
    // 2. Delete the uncompleted order record if session ID exists
    if (uncompletedOrderId) {
        const { error: deleteError } = await supabaseAdmin
            .from('uncompleted_orders')
            .delete()
            .eq('id', uncompletedOrderId);
        
        if (deleteError) {
            console.error('Failed to delete uncompleted order:', deleteError);
        }
    }

    if (newOrder) {
      // 3. Create notification for admin
      await supabaseAdmin.from('notifications').insert({
        recipient_id: newOrder.site_id,
        recipient_type: 'admin',
        site_id: newOrder.site_id,
        order_id: newOrder.id,
        message: `একটি নতুন অর্ডার #${newOrder.order_number} এসেছে। মোট মূল্য: ${newOrder.total.toFixed(2)} BDT.`,
        link: `/admin/orders/${newOrder.id}`,
      });

      // 4. Create notification for customer (if logged in)
      if (newOrder.customer_id) {
        await supabaseAdmin.from('notifications').insert({
          recipient_id: newOrder.customer_id,
          recipient_type: 'customer',
          site_id: newOrder.site_id,
          order_id: newOrder.id,
          message: `আপনার অর্ডার #${newOrder.order_number} সফলভাবে গ্রহণ করা হয়েছে।`,
          link: `/profile/orders/${newOrder.id}`,
        });
      }

      // 5. External SMS API Integration (Paid Users Only)
      try {
        // Fetch Profile to check plan and SMS settings for the site
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('subscription_plan, store_settings(sms_notifications_enabled, admin_sms_number)')
          .eq('id', newOrder.site_id)
          .single();

        const settings = Array.isArray(profile?.store_settings) ? profile?.store_settings[0] : profile?.store_settings;

        // Verify if it's a paid user and SMS is enabled
        if (profile?.subscription_plan !== 'free' && settings?.sms_notifications_enabled && settings?.admin_sms_number) {
          const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
          const siteUrl = `${domain}.${baseDomain}`;

          // Fire and forget to external API to avoid blocking the response
          fetch('https://and-api.vercel.app/api/smsData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: dbOrderData.shipping_info.name,
              customerEmail: dbOrderData.customer_email,
              adminPhone: settings.admin_sms_number,
              orderAmount: dbOrderData.total,
              orderNumber: newOrder.order_number,
              orderId: newOrder.id,
              paymentType: dbOrderData.payment_method === 'cod' ? 'cod' : 'paid',
              paymentMethod: dbOrderData.payment_method,
              domain: siteUrl
            }),
          }).catch(err => console.error("External SMS API Error:", err));
        }
      } catch (smsErr) {
        console.error("SMS Notification pre-check error:", smsErr);
      }
    }

    // Decrypt the order for the response
    const decryptedOrder = decryptObject(newOrder);

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });

  } catch (err: any) {
    console.error('Create Order API Catch Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

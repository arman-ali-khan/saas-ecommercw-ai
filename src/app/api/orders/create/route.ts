
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

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ ...encryptedOrderData, status: 'pending' })
      .select()
      .single();

    if (orderError) throw orderError;
    
    if (uncompletedOrderId) {
        await supabaseAdmin.from('uncompleted_orders').delete().eq('id', uncompletedOrderId);
    }

    if (newOrder) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
      
      // Notify admin via our secure internal notification API to trigger Push
      await fetch(`${baseUrl}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: newOrder.site_id,
          recipientType: 'admin',
          siteId: newOrder.site_id,
          orderId: newOrder.id,
          message: `একটি নতুন অর্ডার #${newOrder.order_number} এসেছে। মোট: ${newOrder.total.toFixed(2)} BDT.`,
          link: `/admin/orders/${newOrder.id}`,
        }),
      }).catch(e => console.error("Admin order notification failed", e));

      if (newOrder.customer_id) {
        await fetch(`${baseUrl}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: newOrder.customer_id,
            recipientType: 'customer',
            siteId: newOrder.site_id,
            orderId: newOrder.id,
            message: `আপনার অর্ডার #${newOrder.order_number} সফলভাবে গ্রহণ করা হয়েছে।`,
            link: `/profile/orders/${newOrder.id}`,
          }),
        }).catch(e => console.error("Customer order notification failed", e));
      }

      // External SMS
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('subscription_plan, store_settings(sms_notifications_enabled, admin_sms_number)')
          .eq('id', newOrder.site_id)
          .single();

        const settings = Array.isArray(profile?.store_settings) ? profile?.store_settings[0] : profile?.store_settings;

        if (profile?.subscription_plan !== 'free' && settings?.sms_notifications_enabled && settings?.admin_sms_number) {
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
              domain: `${domain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top'}`
            }),
          }).catch(err => console.error("External SMS API Error:", err));
        }
      } catch (smsErr) { console.error("SMS skip:", smsErr); }
    }

    return NextResponse.json({ order: decryptObject(newOrder) }, { status: 200 });
  } catch (err: any) {
    console.error('Order API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

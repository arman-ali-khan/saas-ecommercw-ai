import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const { domain, uncompletedOrderId, ...dbOrderData } = orderData;

    // Basic validation
    if (!dbOrderData || !dbOrderData.site_id || !dbOrderData.cart_items) {
      return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Encrypt sensitive order data
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

    if (orderError) {
      console.error('Create Order API Error:', orderError);
      return NextResponse.json({ error: `Database Error: ${orderError.message}` }, { status: 500 });
    }
    
    // Delete uncompleted order
    if (uncompletedOrderId) {
        await supabaseAdmin.from('uncompleted_orders').delete().eq('id', uncompletedOrderId);
    }

    if (newOrder) {
      // Create notification for admin
      await supabaseAdmin.from('notifications').insert({
        recipient_id: newOrder.site_id,
        recipient_type: 'admin',
        site_id: newOrder.site_id,
        order_id: newOrder.id,
        message: `একটি নতুন অর্ডার #${newOrder.order_number} এসেছে। মোট মূল্য: ${newOrder.total.toFixed(2)} BDT.`,
        link: `/admin/orders/${newOrder.id}`,
      });

      // Create notification for customer
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

      // External SMS API Integration
      try {
        const { data: settings } = await supabaseAdmin
          .from('store_settings')
          .select('sms_notifications_enabled, admin_sms_number')
          .eq('site_id', newOrder.site_id)
          .single();

        if (settings?.sms_notifications_enabled && settings?.admin_sms_number) {
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
              paymentMethod: dbOrderData.payment_method
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
    console.error('Create Order API CATCH Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, ...orderData } = body;

    if (!domain || !orderData.site_id || !orderData.cart_items) {
      return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Encrypt sensitive info
    const encryptedOrder = {
        ...orderData,
        customer_email: encrypt(orderData.customer_email),
        shipping_info: {
            ...orderData.shipping_info,
            name: encrypt(orderData.shipping_info.name),
            address: encrypt(orderData.shipping_info.address),
            city: encrypt(orderData.shipping_info.city),
            phone: encrypt(orderData.shipping_info.phone),
            notes: orderData.shipping_info.notes ? encrypt(orderData.shipping_info.notes) : null
        }
    };

    const { data: newOrder, error } = await supabaseAdmin
      .from('orders')
      .insert({ ...encryptedOrder, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    // Async Notifications
    await supabaseAdmin.from('notifications').insert({
        recipient_id: newOrder.site_id,
        recipient_type: 'admin',
        site_id: newOrder.site_id,
        message: `Mobile App: New Order #${newOrder.order_number} received.`,
        link: `/admin/orders/${newOrder.id}`,
    });

    return NextResponse.json({ success: true, order: decryptObject(newOrder) });

  } catch (err: any) {
    console.error('Mobile Order Create Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

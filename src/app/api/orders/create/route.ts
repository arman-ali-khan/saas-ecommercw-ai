
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ ...dbOrderData, status: 'pending' })
      .select()
      .single();

    if (orderError) {
      console.error('Create Order API Error:', orderError);
      return NextResponse.json({ error: `Database Error: ${orderError.message}` }, { status: 500 });
    }
    
    if (uncompletedOrderId) {
        await supabaseAdmin.from('uncompleted_orders').delete().eq('id', uncompletedOrderId);
    }

    if (newOrder) {
      // Notification for admin
      await supabaseAdmin.from('notifications').insert({
        recipient_id: newOrder.site_id,
        recipient_type: 'admin',
        site_id: newOrder.site_id,
        order_id: newOrder.id,
        message: `New order #${newOrder.order_number} has been placed for ${newOrder.total.toFixed(2)} BDT.`,
        link: `/admin/orders/${newOrder.id}`,
      });

      // Notification for customer
      if (newOrder.customer_id) {
        await supabaseAdmin.from('notifications').insert({
            recipient_id: newOrder.customer_id,
            recipient_type: 'customer',
            site_id: newOrder.site_id,
            order_id: newOrder.id,
            message: `Your order #${newOrder.order_number} has been placed successfully.`,
            link: `/profile/orders/${newOrder.id}`
        });
      }
    }

    return NextResponse.json({ order: newOrder }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

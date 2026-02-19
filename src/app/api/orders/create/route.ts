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

    // 1. Create the order
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
      const { error: adminNotifError } = await supabaseAdmin.from('notifications').insert({
        recipient_id: newOrder.site_id,
        recipient_type: 'admin',
        site_id: newOrder.site_id,
        order_id: newOrder.id,
        message: `একটি নতুন অর্ডার #${newOrder.order_number} এসেছে। মোট মূল্য: ${newOrder.total.toFixed(2)} BDT.`,
        link: `/admin/orders/${newOrder.id}`,
      });

      if (adminNotifError) console.error('Admin notification error:', adminNotifError);

      // 4. Create notification for customer (if logged in)
      if (newOrder.customer_id) {
        const { error: custNotifError } = await supabaseAdmin.from('notifications').insert({
          recipient_id: newOrder.customer_id,
          recipient_type: 'customer',
          site_id: newOrder.site_id,
          order_id: newOrder.id,
          message: `আপনার অর্ডার #${newOrder.order_number} সফলভাবে গ্রহণ করা হয়েছে।`,
          link: `/profile/orders/${newOrder.id}`,
        });
        if (custNotifError) console.error('Customer notification error:', custNotifError);
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

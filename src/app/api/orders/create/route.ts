
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/encryption';

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

    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ ...encryptedOrderData, status: 'pending' })
      .select()
      .single();

    if (orderError) {
      console.error('Create Order API Error:', orderError);
      return NextResponse.json({ error: `Database Error: ${orderError.message}` }, { status: 500 });
    }
    
    if (uncompletedOrderId) {
        await supabaseAdmin.from('uncompleted_orders').delete().eq('id', uncompletedOrderId);
    }

    return NextResponse.json({ order: newOrder }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const { domain, ...dbOrderData } = orderData;

    // Basic validation
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

    // --- Create notification for admin ---
    if (newOrder) {
      const notificationMessage = `New order #${newOrder.order_number} has been placed for a total of ${newOrder.total.toFixed(2)} BDT.`;
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: newOrder.site_id, // The admin's ID is the site_id
          recipient_type: 'admin',
          site_id: newOrder.site_id,
          order_id: newOrder.id,
          message: notificationMessage,
          link: `/${domain}/admin/orders/${newOrder.id}`,
        });

      if (notificationError) {
        // Log the error but don't fail the whole request
        console.error('Failed to create notification for admin:', notificationError);
      }
    }
    // --- End notification ---

    return NextResponse.json(newOrder, { status: 200 });

  } catch (err: any) {
    console.error('Create Order API CATCH Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

// Helper function to translate status for the notification message
const translateStatus = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'pending': return 'পেন্ডিং';
        case 'approved': return 'অনুমোদিত';
        case 'processing': return 'প্রক্রিয়াকরণ চলছে';
        case 'packaging': return 'প্যাকেজিং চলছে';
        case 'send for delivery': return 'ডেলিভারির জন্য পাঠানো হয়েছে';
        case 'shipped': return 'পাঠানো হয়েছে';
        case 'delivered': return 'বিতরণ করা হয়েছে';
        case 'canceled': return 'বাতিল করা হয়েছে';
        default: return status;
    }
};

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'Order ID and new status are required' }, { status: 400 });
    }

    // 1. Update the order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) {
        console.error('Update Order Status API - Update Error:', updateError);
        return NextResponse.json({ error: `Database Error: ${updateError.message}` }, { status: 500 });
    }

    // Decrypt the order before returning
    const decryptedOrder = decryptObject(updatedOrder);

    // 2. Create a notification for the customer if the order has a customer_id
    if (updatedOrder && updatedOrder.customer_id) {
        const notificationMessage = `Your order #${updatedOrder.order_number} has been updated to: ${translateStatus(updatedOrder.status)}.`;
        
        const { error: notificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
                recipient_id: updatedOrder.customer_id,
                recipient_type: 'customer',
                site_id: updatedOrder.site_id,
                order_id: updatedOrder.id,
                message: notificationMessage,
                link: `/profile/orders/${updatedOrder.id}`
            });

        if (notificationError) {
            console.error("Update Order Status API - Notification Error:", notificationError);
        }
    }

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });
  } catch (err: any) {
    console.error('Update Order Status API - CATCH Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

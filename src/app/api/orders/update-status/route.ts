
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

    // 1. Get current order details to check if it's already delivered
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('status, cart_items, site_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prevent double decrement if already delivered
    const wasAlreadyDelivered = currentOrder.status.toLowerCase() === 'delivered';

    // 2. Update the order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // Decrypt the order before returning to client
    const decryptedOrder = decryptObject(updatedOrder);

    // 3. Handle Stock Decrement when moving to 'delivered'
    if (newStatus.toLowerCase() === 'delivered' && !wasAlreadyDelivered) {
      const items = decryptedOrder.cart_items || [];
      
      for (const item of items) {
        // Fetch current product state
        const { data: product, error: pError } = await supabaseAdmin
          .from('products')
          .select('stock, variants')
          .eq('id', item.id)
          .eq('site_id', currentOrder.site_id)
          .single();

        if (pError || !product) continue;

        let updates: any = {};

        // Case A: Product has variants and a unit was selected
        if (item.selected_unit && product.variants && Array.isArray(product.variants)) {
          const updatedVariants = product.variants.map((v: any) => {
            if (v.unit === item.selected_unit) {
              return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
            }
            return v;
          });
          updates.variants = updatedVariants;
        } 
        
        // Case B: Product has a main stock count (simple product)
        if (product.stock !== undefined && product.stock !== null) {
          updates.stock = Math.max(0, product.stock - item.quantity);
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', item.id)
            .eq('site_id', currentOrder.site_id);
        }
      }
    }

    // 4. Create notification for the customer
    if (updatedOrder && updatedOrder.customer_id) {
        await supabaseAdmin.from('notifications').insert({
            recipient_id: updatedOrder.customer_id,
            recipient_type: 'customer',
            site_id: updatedOrder.site_id,
            order_id: updatedOrder.id,
            message: `আপনার অর্ডার #${updatedOrder.order_number}-এর অবস্থা পরিবর্তন করে করা হয়েছে: ${translateStatus(updatedOrder.status)}।`,
            link: `/profile/orders/${updatedOrder.id}`
        });
    }

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });
  } catch (err: any) {
    console.error('Update Status API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

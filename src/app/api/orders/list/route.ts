
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();
    if (!siteId) return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt orders
    const decryptedOrders = data.map(order => ({
        ...order,
        customer_email: decrypt(order.customer_email),
        shipping_info: {
            ...order.shipping_info,
            name: decrypt(order.shipping_info.name),
            address: decrypt(order.shipping_info.address),
            city: decrypt(order.shipping_info.city),
            phone: decrypt(order.shipping_info.phone),
            notes: decrypt(order.shipping_info.notes)
        }
    }));

    return NextResponse.json({ orders: decryptedOrders }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

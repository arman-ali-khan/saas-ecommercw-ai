
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { orderId, siteId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const query = supabaseAdmin.from('orders').select('*').eq('id', orderId);
    if (siteId) query.eq('site_id', siteId);

    const { data, error } = await query.single();

    if (error) throw error;

    // Decrypt single order
    const decryptedOrder = {
        ...data,
        customer_email: decrypt(data.customer_email),
        shipping_info: {
            ...data.shipping_info,
            name: decrypt(data.shipping_info.name),
            address: decrypt(data.shipping_info.address),
            city: decrypt(data.shipping_info.city),
            phone: decrypt(data.shipping_info.phone),
            notes: decrypt(data.shipping_info.notes)
        }
    };

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

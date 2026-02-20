
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { orderId, customerId, siteId } = await request.json();

    if (!orderId || !customerId) {
      return NextResponse.json({ error: 'Order ID and Customer ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .match({ id: orderId, customer_id: customerId })
      .single();

    if (error) {
      return NextResponse.json({ error: 'Order not found or access denied.' }, { status: 404 });
    }

    // Decrypt order sensitive fields recursively
    const decryptedOrder = decryptObject(data);

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });
  } catch (err: any) {
    console.error('Get Order Details API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

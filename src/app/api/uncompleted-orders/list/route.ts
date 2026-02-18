
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('uncompleted_orders')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt the customer_info field inside the results
    const decryptedOrders = data.map(order => ({
        ...order,
        customer_info: decryptObject(order.customer_info)
    }));

    return NextResponse.json({ orders: decryptedOrders }, { status: 200 });
  } catch (err: any) {
    console.error('List Uncompleted Orders API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

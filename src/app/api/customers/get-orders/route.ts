
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { customerId, siteId } = await request.json();

    if (!customerId || !siteId) {
      return NextResponse.json({ error: 'Customer ID and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .match({ customer_id: customerId, site_id: siteId })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in customer get-orders API:', error);
      throw error;
    }

    // Decrypt all orders in the list
    const decryptedOrders = decryptObject(data);

    return NextResponse.json({ orders: decryptedOrders }, { status: 200 });
  } catch (err: any) {
    console.error('List Customer Orders API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

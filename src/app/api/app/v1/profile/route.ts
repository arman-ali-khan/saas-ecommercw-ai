
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

/**
 * @fileOverview Profile API for Mobile App.
 * Returns decrypted profile info and recent order history.
 */

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

    const [userRes, ordersRes] = await Promise.all([
      supabaseAdmin.from('customer_profiles').select('*').match({ id: customerId, site_id: siteId }).single(),
      supabaseAdmin.from('orders').select('*').match({ customer_id: customerId, site_id: siteId }).order('created_at', { ascending: false }).limit(10)
    ]);

    if (userRes.error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const decryptedUser = decryptObject(userRes.data);
    const decryptedOrders = decryptObject(ordersRes.data || []);

    const { password_hash, ...safeUser } = decryptedUser;

    return NextResponse.json({ 
      profile: safeUser,
      recent_orders: decryptedOrders
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

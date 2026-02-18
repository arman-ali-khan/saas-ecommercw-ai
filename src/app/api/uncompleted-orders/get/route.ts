
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptObject } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { id, siteId } = await request.json();

    if (!id || !siteId) {
      return NextResponse.json({ error: 'ID and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('uncompleted_orders')
      .select('*')
      .match({ id, site_id: siteId })
      .single();

    if (error) throw error;

    // Decrypt data
    const decryptedOrder = {
        ...data,
        customer_info: decryptObject(data.customer_info)
    };

    return NextResponse.json({ order: decryptedOrder }, { status: 200 });
  } catch (err: any) {
    console.error('Get Uncompleted Order API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

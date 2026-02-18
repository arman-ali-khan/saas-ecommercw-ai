
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

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
      .from('customer_profiles')
      .select('*')
      .match({ id: customerId, site_id: siteId })
      .single();

    if (error) {
      console.error('Database error in customer get API:', error);
      throw error;
    }

    // Decrypt data
    const decryptedCustomer = {
        ...data,
        full_name: decrypt(data.full_name),
        email: decrypt(data.email)
    };

    return NextResponse.json({ customer: decryptedCustomer }, { status: 200 });
  } catch (err: any) {
    console.error('Get Customer API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, ...paymentData } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ 
        site_id: siteId,
        mobile_banking_enabled: paymentData.mobileBankingEnabled,
        mobile_banking_number: paymentData.mobileBankingNumber,
        mobile_banking_type: paymentData.mobileBankingType,
        accepted_banking_methods: paymentData.acceptedBankingMethods
      }, { onConflict: 'site_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save Payments API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

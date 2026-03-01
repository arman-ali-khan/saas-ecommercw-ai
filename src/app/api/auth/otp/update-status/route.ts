
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview API to update the 'is_send' status of an OTP record.
 * This is used to mark an OTP as successfully dispatched by an external gateway.
 */

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

    // Update is_send to true for the specific OTP record
    const { error } = await supabaseAdmin
      .from('customer_otps')
      .update({ is_send: true })
      .match({ id, site_id: siteId });

    if (error) {
        console.error('Database update error:', error);
        throw error;
    }

    return NextResponse.json({ success: true, message: 'OTP status updated to sent.' }, { status: 200 });
  } catch (err: any) {
    console.error('Update OTP Status API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

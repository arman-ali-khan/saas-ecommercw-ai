
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Public API to list all generated OTPs.
 * Useful for debugging or automated testing environments.
 */

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('customer_otps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        count: data?.length || 0,
        otps: data 
    }, { status: 200 });

  } catch (err: any) {
    console.error('List OTP API Error:', err);
    return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch OTPs' 
    }, { status: 500 });
  }
}

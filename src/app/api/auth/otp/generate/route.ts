
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addMinutes } from 'date-fns';
import { decrypt } from '@/lib/encryption';

/**
 * @fileOverview API to generate a 6-digit OTP for phone or email verification.
 * Supports both registration and password reset flows.
 */

export async function POST(request: Request) {
  try {
    const { identifier, type, siteId, purpose } = await request.json();

    if (!identifier || !siteId || !type) {
      return NextResponse.json({ error: 'তথ্য অসম্পূর্ণ। পুনরায় চেষ্টা করুন।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. If purpose is password_reset, verify user exists first
    if (purpose === 'password_reset') {
        const { data: users } = await supabaseAdmin
            .from('customer_profiles')
            .select('email, phone')
            .eq('site_id', siteId);
        
        const userExists = users?.some(u => {
            const val = type === 'email' ? decrypt(u.email) : decrypt(u.phone);
            return val.toLowerCase() === identifier.toLowerCase().trim();
        });

        if (!userExists) {
            return NextResponse.json({ error: 'এই ঠিকানায় কোনো অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 404 });
        }
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = addMinutes(new Date(), 10); // 10 minute expiry

    // 3. Save OTP to DB
    const insertData: any = {
        site_id: siteId,
        otp: otp,
        expires_at: expiresAt.toISOString()
    };

    if (type === 'email') insertData.email = identifier.toLowerCase().trim();
    else insertData.phone = identifier.trim();

    const { error: otpError } = await supabaseAdmin
      .from('customer_otps')
      .insert(insertData);

    if (otpError) throw otpError;

    // 4. Send Notification (Simulated/Actual)
    console.log(`[OTP GENERATED] To: ${identifier}, OTP: ${otp}`);
    
    // In production, trigger Email API or SMS Gateway here.

    return NextResponse.json({ success: true, message: 'ওটিপি পাঠানো হয়েছে।' }, { status: 200 });

  } catch (err: any) {
    console.error('Generate OTP API Error:', err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}

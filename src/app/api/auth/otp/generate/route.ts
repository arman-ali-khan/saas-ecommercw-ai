
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addMinutes } from 'date-fns';

/**
 * @fileOverview API to generate a 6-digit OTP for phone verification.
 * Saves OTP to customer_otps table and potentially triggers an external SMS gateway.
 */

export async function POST(request: Request) {
  try {
    const { phone, siteId } = await request.json();

    if (!phone || !siteId) {
      return NextResponse.json({ error: 'ফোন নম্বর এবং সাইট আইডি প্রয়োজন।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = addMinutes(new Date(), 5); // 5 minute expiry

    // 2. Save OTP to DB
    const { error: otpError } = await supabaseAdmin
      .from('customer_otps')
      .insert({
        site_id: siteId,
        phone: phone,
        otp: otp,
        expires_at: expiresAt.toISOString()
      });

    if (otpError) throw otpError;

    // 3. Optional: Trigger External SMS Gateway (if admin has SMS enabled)
    try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('subscription_plan, store_settings(sms_notifications_enabled, admin_sms_number)')
          .eq('id', siteId)
          .single();

        const settings = Array.isArray(profile?.store_settings) ? profile?.store_settings[0] : profile?.store_settings;

        if (profile?.subscription_plan !== 'free' && settings?.sms_notifications_enabled) {
            // Logic to call your SMS provider (e.g. Infobip, Twilio, or custom)
            // Example message: "Your OTP for registration is: 123456"
            console.log(`[SMS SEND] To: ${phone}, OTP: ${otp}`);
        }
    } catch (e) {
        console.warn("SMS sending logic skipped or failed:", e);
    }

    return NextResponse.json({ success: true, message: 'ওটিপি পাঠানো হয়েছে।' }, { status: 200 });

  } catch (err: any) {
    console.error('Generate OTP API Error:', err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' }, { status: 500 });
  }
}

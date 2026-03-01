
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

/**
 * @fileOverview API to reset customer password after OTP verification.
 */

export async function POST(request: Request) {
  try {
    const { identifier, newPassword, otp, siteId } = await request.json();

    if (!identifier || !newPassword || !otp || !siteId) {
      return NextResponse.json({ error: 'তথ্য অসম্পূর্ণ।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify OTP one last time for safety
    const isEmail = identifier.includes('@');
    let otpQuery = supabaseAdmin
      .from('customer_otps')
      .select('id')
      .eq('site_id', siteId)
      .eq('otp', otp);
    
    if (isEmail) otpQuery = otpQuery.eq('email', identifier.toLowerCase().trim());
    else otpQuery = otpQuery.eq('phone', identifier.trim());

    const { data: otpCheck } = await otpQuery.maybeSingle();

    if (!otpCheck) {
      return NextResponse.json({ error: 'ভেরিফিকেশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' }, { status: 401 });
    }

    // 2. Find and update the user
    const { data: users } = await supabaseAdmin
        .from('customer_profiles')
        .select('id, email, phone')
        .eq('site_id', siteId);
    
    const targetUser = users?.find(u => {
        const val = isEmail ? decrypt(u.email) : decrypt(u.phone);
        return val.toLowerCase() === identifier.toLowerCase().trim();
    });

    if (!targetUser) {
        return NextResponse.json({ error: 'ইউজার খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
        .from('customer_profiles')
        .update({ password_hash })
        .eq('id', targetUser.id);

    if (updateError) throw updateError;

    // 3. Cleanup: Delete the used OTP
    await supabaseAdmin.from('customer_otps').delete().eq('id', otpCheck.id);

    return NextResponse.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে রিসেট হয়েছে।' }, { status: 200 });

  } catch (err: any) {
    console.error('Reset Password API Error:', err);
    return NextResponse.json({ error: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
